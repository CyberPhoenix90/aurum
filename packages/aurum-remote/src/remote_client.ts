import {
    ArrayDataSource,
    CancellationToken,
    DataSource,
    DuplexDataSource,
    EventEmitter,
    MapDataSource,
    ObjectDataSource,
    SetDataSource
} from '@aurum/streams';
import { RemoteMessage, RemoteProtocol, createRemoteMessage, decodeRemoteMessages } from './protocol.js';

export interface WebSocketLike {
    readonly readyState: number;
    send(data: string): void;
    close(code?: number, reason?: string): void;
    addEventListener(type: string, listener: (event: any) => void): void;
    removeEventListener(type: string, listener: (event: any) => void): void;
}

export type WebSocketFactory = new (url: string) => WebSocketLike;

export interface RemoteClientOptions {
    url: string;
    webSocketFactory?: WebSocketFactory;
    reconnect?: boolean;
    reconnectMinDelayMs?: number;
    reconnectMaxDelayMs?: number;
    connectTimeoutMs?: number;
    rpcTimeoutMs?: number;
    heartbeatIntervalMs?: number;
    heartbeatTimeoutMs?: number;
    subscriptionAckTimeoutMs?: number;
}

export interface RemoteCallOptions {
    token?: string;
    cancellationToken?: CancellationToken;
    timeoutMs?: number;
}

export interface RemoteSourceOptions {
    token?: string;
    cancellationToken: CancellationToken;
}

export interface RemoteClientError {
    type: RemoteProtocol;
    id?: string;
    code?: number;
    message: string;
}

export interface RemoteSubscriptionState {
    id: string;
    type: RemoteProtocol;
    state: 'subscribed' | 'resynchronizing';
    revision?: number;
}

interface EventTargetLike {
    addEventListener(type: string, listener: () => void): void;
    removeEventListener(type: string, listener: () => void): void;
}

interface Binding {
    id: string;
    token?: string;
    listenType: RemoteProtocol;
    cancelType: RemoteProtocol;
    consumers: Map<object, (message: RemoteMessage) => void>;
    acknowledged: boolean;
    revision?: number;
    resynchronizing: boolean;
    acknowledgementTimer?: ReturnType<typeof setTimeout>;
}

interface PendingRPC {
    resolve(value: unknown): void;
    reject(error: Error): void;
    cleanup(): void;
}

export class RemoteClient {
    public readonly errors = new EventEmitter<RemoteClientError>();
    public readonly subscriptionState = new EventEmitter<RemoteSubscriptionState>();
    private readonly options: Required<Omit<RemoteClientOptions, 'webSocketFactory'>> & { webSocketFactory: WebSocketFactory };
    private readonly bindings = new Map<string, Binding>();
    private readonly pendingRPC = new Map<string, PendingRPC>();
    private socket?: WebSocketLike;
    private connected = false;
    private hasConnected = false;
    private explicitlyClosed = false;
    private reconnectDelay: number;
    private reconnectTimer?: ReturnType<typeof setTimeout>;
    private heartbeatTimer?: ReturnType<typeof setInterval>;
    private heartbeatSentAt?: number;
    private lastHeartbeatTick = 0;
    private nextRequestId = 0;
    private socketGeneration = 0;
    private readonly wakeCleanup: Array<() => void> = [];

    private constructor(options: RemoteClientOptions) {
        const factory = options.webSocketFactory ?? (globalThis.WebSocket as unknown as WebSocketFactory);
        if (!factory) {
            throw new Error('A WebSocket implementation is required outside browser environments');
        }
        this.options = {
            url: options.url,
            webSocketFactory: factory,
            reconnect: options.reconnect ?? true,
            reconnectMinDelayMs: options.reconnectMinDelayMs ?? 250,
            reconnectMaxDelayMs: options.reconnectMaxDelayMs ?? 10_000,
            connectTimeoutMs: options.connectTimeoutMs ?? 10_000,
            rpcTimeoutMs: options.rpcTimeoutMs ?? 30_000,
            heartbeatIntervalMs: options.heartbeatIntervalMs ?? 5_000,
            heartbeatTimeoutMs: options.heartbeatTimeoutMs ?? 15_000,
            subscriptionAckTimeoutMs: options.subscriptionAckTimeoutMs ?? 10_000
        };
        this.reconnectDelay = this.options.reconnectMinDelayMs;
        this.installWakeListeners();
    }

    public static async connect(options: RemoteClientOptions): Promise<RemoteClient> {
        const client = new RemoteClient(options);
        try {
            await client.open();
            return client;
        } catch (error) {
            client.close(4000, 'initial connection failed');
            throw error;
        }
    }

    public get isConnected(): boolean {
        return this.connected;
    }

    /** Immediately checks a connection after a device or page wakes. */
    public probe(): void {
        if (this.explicitlyClosed) {
            return;
        }
        if (this.socket?.readyState === 1 && this.connected) {
            this.heartbeatSentAt = undefined;
            this.lastHeartbeatTick = Date.now();
            this.sendHeartbeat();
        } else if (this.hasConnected && (!this.socket || this.socket.readyState >= 2)) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
            this.scheduleReconnect(0);
        }
    }

    public async call<I, O>(id: string, input: I, options: RemoteCallOptions = {}): Promise<O> {
        if (!this.connected) {
            throw new Error('Remote client is not connected');
        }
        const uuid = this.createRequestId();
        const timeoutMs = options.timeoutMs ?? this.options.rpcTimeoutMs;
        return new Promise<O>((resolve, reject) => {
            let settled = false;
            const timeout = setTimeout(() => {
                this.send(RemoteProtocol.CANCEL_RPC, { id, uuid });
                finish(new Error(`RPC ${id} timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            const cancel = () => {
                this.send(RemoteProtocol.CANCEL_RPC, { id, uuid });
                finish(new Error(`RPC ${id} was cancelled`));
            };
            const finish = (error?: Error, result?: unknown) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(timeout);
                this.pendingRPC.delete(uuid);
                if (options.cancellationToken && !options.cancellationToken.isCancelled) {
                    options.cancellationToken.removeCancellable(cancel);
                }
                if (error) {
                    reject(error);
                } else {
                    resolve(result as O);
                }
            };
            options.cancellationToken?.addCancellable(cancel);
            this.pendingRPC.set(uuid, {
                resolve: (result) => finish(undefined, result),
                reject: (error) => finish(error),
                cleanup: () => clearTimeout(timeout)
            });
            this.send(RemoteProtocol.PERFORM_RPC, { id, uuid, token: options.token, value: input });
        });
    }

    public syncDataSource<T>(source: DataSource<T>, id: string, options: RemoteSourceOptions): void {
        this.bind(source, id, options, RemoteProtocol.LISTEN_DATASOURCE, RemoteProtocol.CANCEL_DATASOURCE, (message) =>
            source.update(message.value as T)
        );
    }

    public syncDuplexDataSource<T>(source: DuplexDataSource<T>, id: string, options: RemoteSourceOptions): void {
        this.bind(source, id, options, RemoteProtocol.LISTEN_DUPLEX_DATASOURCE, RemoteProtocol.CANCEL_DUPLEX_DATASOURCE, (message) =>
            source.updateDownstream(message.value as T)
        );
        source.listenUpstream(
            (value) => this.send(RemoteProtocol.UPDATE_DUPLEX_DATASOURCE, { id, token: options.token, value }),
            options.cancellationToken
        );
    }

    public syncArrayDataSource<T>(source: ArrayDataSource<T>, id: string, options: RemoteSourceOptions): void {
        this.bind(source, id, options, RemoteProtocol.LISTEN_ARRAY_DATASOURCE, RemoteProtocol.CANCEL_ARRAY_DATASOURCE, (message) =>
            source.applyCollectionChange(message.change as any)
        );
    }

    public syncMapDataSource<K, V>(source: MapDataSource<K, V>, id: string, options: RemoteSourceOptions): void {
        this.bind(source, id, options, RemoteProtocol.LISTEN_MAP_DATASOURCE, RemoteProtocol.CANCEL_MAP_DATASOURCE, (message) =>
            source.applyMapChange(message.change as any)
        );
    }

    public syncObjectDataSource<T extends object>(source: ObjectDataSource<T>, id: string, options: RemoteSourceOptions): void {
        this.bind(source, id, options, RemoteProtocol.LISTEN_OBJECT_DATASOURCE, RemoteProtocol.CANCEL_OBJECT_DATASOURCE, (message) =>
            source.applyObjectChange(message.change as any)
        );
    }

    public syncSetDataSource<T>(source: SetDataSource<T>, id: string, options: RemoteSourceOptions): void {
        this.bind(source, id, options, RemoteProtocol.LISTEN_SET_DATASOURCE, RemoteProtocol.CANCEL_SET_DATASOURCE, (message) =>
            source.applySetChange(message.change as any)
        );
    }

    public close(code = 1000, reason = 'client closed'): void {
        if (this.explicitlyClosed) {
            return;
        }
        this.explicitlyClosed = true;
        this.connected = false;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
        clearInterval(this.heartbeatTimer);
        for (const binding of this.bindings.values()) {
            clearTimeout(binding.acknowledgementTimer);
        }
        this.wakeCleanup.splice(0).forEach((cleanup) => cleanup());
        this.rejectPendingRPC(new Error('Remote client closed'));
        this.socket?.close(code, reason);
    }

    private bind(
        source: object,
        id: string,
        options: RemoteSourceOptions,
        listenType: RemoteProtocol,
        cancelType: RemoteProtocol,
        apply: (message: RemoteMessage) => void
    ): void {
        const key = `${listenType}\u0000${id}\u0000${options.token ?? ''}`;
        let binding = this.bindings.get(key);
        if (!binding) {
            binding = {
                id,
                token: options.token,
                listenType,
                cancelType,
                consumers: new Map(),
                acknowledged: false,
                resynchronizing: false
            };
            this.bindings.set(key, binding);
        }
        const wasEmpty = binding.consumers.size === 0;
        binding.consumers.set(source, apply);
        if (wasEmpty) {
            this.requestBinding(binding);
        }
        options.cancellationToken.addCancellable(() => {
            const current = this.bindings.get(key);
            current?.consumers.delete(source);
            if (current && current.consumers.size === 0) {
                this.bindings.delete(key);
                clearTimeout(current.acknowledgementTimer);
                this.send(cancelType, { id, token: options.token });
            }
        });
    }

    private async open(): Promise<void> {
        const generation = ++this.socketGeneration;
        const socket = new this.options.webSocketFactory(this.options.url);
        this.socket = socket;
        const isCurrent = () => this.socket === socket && this.socketGeneration === generation;
        await new Promise<void>((resolve, reject) => {
            let acknowledged = false;
            let settled = false;
            const timeout = setTimeout(() => {
                if (!isCurrent()) {
                    fail(new Error(`Connection attempt to ${this.options.url} was superseded`));
                    return;
                }
                socket.close(4000, 'handshake timeout');
                fail(new Error(`Connection to ${this.options.url} timed out during handshake`));
            }, this.options.connectTimeoutMs);
            const succeed = () => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(timeout);
                resolve();
            };
            const fail = (error: Error) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(timeout);
                reject(error);
            };
            const onOpen = () => {
                if (isCurrent()) {
                    this.send(RemoteProtocol.HELLO);
                }
            };
            const onMessage = (event: { data: string | ArrayBuffer | ArrayBufferView }) => {
                if (!isCurrent()) {
                    return;
                }
                try {
                    for (const message of decodeRemoteMessages(event.data)) {
                        this.heartbeatSentAt = undefined;
                        if (message.type === RemoteProtocol.HELLO_ACK && !acknowledged) {
                            acknowledged = true;
                            this.connected = true;
                            this.hasConnected = true;
                            this.reconnectDelay = this.options.reconnectMinDelayMs;
                            this.startHeartbeat();
                            for (const binding of this.bindings.values()) {
                                binding.revision = undefined;
                                binding.resynchronizing = false;
                                this.requestBinding(binding);
                            }
                            succeed();
                        } else {
                            this.handleMessage(message);
                        }
                    }
                } catch (error) {
                    this.errors.fire({ type: RemoteProtocol.PROTOCOL_ERROR, message: toError(error).message });
                }
            };
            const onError = () => {
                if (isCurrent() && !acknowledged) {
                    socket.close();
                    fail(new Error(`Failed to connect to ${this.options.url}`));
                }
            };
            const onClose = () => {
                socket.removeEventListener('open', onOpen);
                socket.removeEventListener('message', onMessage);
                socket.removeEventListener('error', onError);
                socket.removeEventListener('close', onClose);
                if (isCurrent()) {
                    this.socket = undefined;
                    this.handleClose();
                }
                if (!acknowledged) {
                    fail(new Error(`Connection to ${this.options.url} closed before handshake`));
                }
            };
            socket.addEventListener('open', onOpen);
            socket.addEventListener('message', onMessage);
            socket.addEventListener('error', onError);
            socket.addEventListener('close', onClose);
        });
    }

    private handleMessage(message: RemoteMessage): void {
        switch (message.type) {
            case RemoteProtocol.HEARTBEAT:
                return;
            case RemoteProtocol.SUBSCRIPTION_ACK:
                this.acknowledgeSubscription(message);
                return;
            case RemoteProtocol.PERFORM_RPC_RESULT:
                this.pendingRPC.get(message.uuid!)?.resolve(message.result);
                return;
            case RemoteProtocol.PERFORM_RPC_ERR:
            case RemoteProtocol.PERFORM_RPC_RESULT_ERR:
                this.pendingRPC.get(message.uuid!)?.reject(new Error(message.error ?? 'Remote RPC failed'));
                return;
        }
        if (message.type.endsWith('.error')) {
            this.rejectSubscription(message);
            this.errors.fire({ type: message.type, id: message.id, code: message.errorCode, message: message.error ?? 'Remote operation failed' });
            return;
        }
        for (const binding of this.bindings.values()) {
            if (binding.id === message.id && updateTypeFor(binding.listenType) === message.type) {
                if (binding.listenType === RemoteProtocol.LISTEN_ARRAY_DATASOURCE) {
                    if (message.snapshot) {
                        for (const apply of binding.consumers.values()) {
                            apply(message);
                        }
                        binding.revision = message.revision;
                        binding.resynchronizing = false;
                        continue;
                    }
                    if (binding.revision === undefined || message.revision !== binding.revision + 1) {
                        this.resynchronizeArray(binding);
                        continue;
                    }
                }
                for (const apply of binding.consumers.values()) {
                    apply(message);
                }
                if (binding.listenType === RemoteProtocol.LISTEN_ARRAY_DATASOURCE) {
                    binding.revision = message.revision;
                }
            }
        }
    }

    private send(type: RemoteProtocol, payload: Omit<RemoteMessage, 'version' | 'type'> = {}): void {
        if (this.socket?.readyState === 1) {
            this.socket.send(JSON.stringify(createRemoteMessage(type, payload)));
        }
    }

    private requestBinding(binding: Binding): void {
        clearTimeout(binding.acknowledgementTimer);
        binding.acknowledged = false;
        if (!this.connected || this.socket?.readyState !== 1) {
            return;
        }
        this.send(binding.listenType, { id: binding.id, token: binding.token });
        const checkAcknowledgement = () => {
            if (binding.acknowledged || !this.bindingsHas(binding) || this.explicitlyClosed) {
                return;
            }
            if (isPageHidden()) {
                binding.acknowledgementTimer = setTimeout(checkAcknowledgement, this.options.subscriptionAckTimeoutMs);
                return;
            }
            this.errors.fire({
                type: RemoteProtocol.PROTOCOL_ERROR,
                id: binding.id,
                message: `Subscription ${binding.id} was not acknowledged within ${this.options.subscriptionAckTimeoutMs}ms`
            });
            this.socket?.close(4001, 'subscription acknowledgement timeout');
        };
        binding.acknowledgementTimer = setTimeout(checkAcknowledgement, this.options.subscriptionAckTimeoutMs);
    }

    private acknowledgeSubscription(message: RemoteMessage): void {
        for (const binding of this.bindings.values()) {
            if (binding.id === message.id && binding.listenType === message.subscriptionType) {
                binding.acknowledged = true;
                clearTimeout(binding.acknowledgementTimer);
                this.subscriptionState.fire({
                    id: binding.id,
                    type: binding.listenType,
                    state: 'subscribed',
                    revision: binding.revision
                });
            }
        }
    }

    private rejectSubscription(message: RemoteMessage): void {
        for (const binding of this.bindings.values()) {
            if (binding.id === message.id && listenErrorFor(binding.listenType) === message.type) {
                clearTimeout(binding.acknowledgementTimer);
            }
        }
    }

    private resynchronizeArray(binding: Binding): void {
        if (binding.resynchronizing) {
            return;
        }
        binding.resynchronizing = true;
        binding.revision = undefined;
        this.subscriptionState.fire({ id: binding.id, type: binding.listenType, state: 'resynchronizing' });
        this.send(binding.cancelType, { id: binding.id, token: binding.token });
        this.requestBinding(binding);
    }

    private bindingsHas(target: Binding): boolean {
        for (const binding of this.bindings.values()) {
            if (binding === target) {
                return true;
            }
        }
        return false;
    }

    private sendHeartbeat(): void {
        if (!this.connected || this.socket?.readyState !== 1) {
            return;
        }
        this.heartbeatSentAt = Date.now();
        this.send(RemoteProtocol.HEARTBEAT);
    }

    private installWakeListeners(): void {
        const scope = globalThis as unknown as EventTargetLike;
        if (typeof scope.addEventListener === 'function') {
            const onOnline = () => this.probe();
            scope.addEventListener('online', onOnline);
            this.wakeCleanup.push(() => scope.removeEventListener('online', onOnline));
        }
        const documentTarget = (globalThis as unknown as { document?: EventTargetLike }).document;
        if (documentTarget && typeof documentTarget.addEventListener === 'function') {
            const onVisibilityChange = () => {
                if (!isPageHidden()) {
                    this.probe();
                }
            };
            documentTarget.addEventListener('visibilitychange', onVisibilityChange);
            this.wakeCleanup.push(() => documentTarget.removeEventListener('visibilitychange', onVisibilityChange));
        }
    }

    private handleClose(): void {
        this.connected = false;
        clearInterval(this.heartbeatTimer);
        this.heartbeatSentAt = undefined;
        for (const binding of this.bindings.values()) {
            clearTimeout(binding.acknowledgementTimer);
            binding.acknowledged = false;
        }
        this.rejectPendingRPC(new Error('Connection closed before RPC completed'));
        if (this.hasConnected) {
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect(delay = this.reconnectDelay): void {
        if (this.explicitlyClosed || !this.options.reconnect || this.reconnectTimer) {
            return;
        }
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined;
            this.open().catch(() => this.scheduleReconnect());
        }, delay);
        this.reconnectDelay = Math.min(this.options.reconnectMaxDelayMs, this.reconnectDelay * 2);
    }

    private startHeartbeat(): void {
        this.heartbeatSentAt = undefined;
        this.lastHeartbeatTick = Date.now();
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => {
            const now = Date.now();
            const elapsedSinceTick = now - this.lastHeartbeatTick;
            this.lastHeartbeatTick = now;
            if (elapsedSinceTick > this.options.heartbeatIntervalMs * 2) {
                this.heartbeatSentAt = undefined;
            }
            if (this.heartbeatSentAt !== undefined && now - this.heartbeatSentAt > this.options.heartbeatTimeoutMs) {
                this.socket?.close(4000, 'heartbeat timeout');
                return;
            }
            if (this.heartbeatSentAt === undefined) {
                this.sendHeartbeat();
            }
        }, this.options.heartbeatIntervalMs);
    }

    private rejectPendingRPC(error: Error): void {
        for (const pending of this.pendingRPC.values()) {
            pending.cleanup();
            pending.reject(error);
        }
        this.pendingRPC.clear();
    }

    private createRequestId(): string {
        const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
        return randomUUID ? randomUUID() : `${Date.now().toString(36)}-${(++this.nextRequestId).toString(36)}`;
    }
}

export function getRemoteFunction<I, O>(client: RemoteClient, id: string, options: RemoteCallOptions = {}): (input: I) => Promise<O> {
    return (input) => client.call<I, O>(id, input, options);
}

export function createRemoteDataSource<T>(
    client: RemoteClient,
    id: string,
    options: RemoteSourceOptions,
    initialValue?: T
): DataSource<T> {
    const source = new DataSource<T>(initialValue);
    client.syncDataSource(source, id, options);
    return source;
}

export function createRemoteDuplexDataSource<T>(
    client: RemoteClient,
    id: string,
    options: RemoteSourceOptions,
    initialValue?: T
): DuplexDataSource<T> {
    const source = new DuplexDataSource<T>(initialValue, false);
    client.syncDuplexDataSource(source, id, options);
    return source;
}

export function createRemoteArrayDataSource<T>(
    client: RemoteClient,
    id: string,
    options: RemoteSourceOptions,
    initialValue: T[] = []
): ArrayDataSource<T> {
    const source = new ArrayDataSource<T>(initialValue);
    client.syncArrayDataSource(source, id, options);
    return source;
}

export function createRemoteMapDataSource<K, V>(
    client: RemoteClient,
    id: string,
    options: RemoteSourceOptions,
    initialValue?: Map<K, V>
): MapDataSource<K, V> {
    const source = new MapDataSource<K, V>(initialValue);
    client.syncMapDataSource(source, id, options);
    return source;
}

export function createRemoteObjectDataSource<T extends object>(
    client: RemoteClient,
    id: string,
    options: RemoteSourceOptions,
    initialValue: T
): ObjectDataSource<T> {
    const source = new ObjectDataSource<T>(initialValue);
    client.syncObjectDataSource(source, id, options);
    return source;
}

export function createRemoteSetDataSource<T>(
    client: RemoteClient,
    id: string,
    options: RemoteSourceOptions,
    initialValue?: Set<T> | T[]
): SetDataSource<T> {
    const source = new SetDataSource<T>(initialValue);
    client.syncSetDataSource(source, id, options);
    return source;
}

function updateTypeFor(listenType: RemoteProtocol): RemoteProtocol {
    switch (listenType) {
        case RemoteProtocol.LISTEN_DATASOURCE:
            return RemoteProtocol.UPDATE_DATASOURCE;
        case RemoteProtocol.LISTEN_DUPLEX_DATASOURCE:
            return RemoteProtocol.UPDATE_DUPLEX_DATASOURCE;
        case RemoteProtocol.LISTEN_ARRAY_DATASOURCE:
            return RemoteProtocol.UPDATE_ARRAY_DATASOURCE;
        case RemoteProtocol.LISTEN_MAP_DATASOURCE:
            return RemoteProtocol.UPDATE_MAP_DATASOURCE;
        case RemoteProtocol.LISTEN_OBJECT_DATASOURCE:
            return RemoteProtocol.UPDATE_OBJECT_DATASOURCE;
        case RemoteProtocol.LISTEN_SET_DATASOURCE:
            return RemoteProtocol.UPDATE_SET_DATASOURCE;
        default:
            throw new Error(`Unsupported source subscription ${listenType}`);
    }
}

function listenErrorFor(listenType: RemoteProtocol): RemoteProtocol {
    switch (listenType) {
        case RemoteProtocol.LISTEN_DATASOURCE:
            return RemoteProtocol.LISTEN_DATASOURCE_ERR;
        case RemoteProtocol.LISTEN_DUPLEX_DATASOURCE:
            return RemoteProtocol.LISTEN_DUPLEX_DATASOURCE_ERR;
        case RemoteProtocol.LISTEN_ARRAY_DATASOURCE:
            return RemoteProtocol.LISTEN_ARRAY_DATASOURCE_ERR;
        case RemoteProtocol.LISTEN_MAP_DATASOURCE:
            return RemoteProtocol.LISTEN_MAP_DATASOURCE_ERR;
        case RemoteProtocol.LISTEN_OBJECT_DATASOURCE:
            return RemoteProtocol.LISTEN_OBJECT_DATASOURCE_ERR;
        case RemoteProtocol.LISTEN_SET_DATASOURCE:
            return RemoteProtocol.LISTEN_SET_DATASOURCE_ERR;
        default:
            throw new Error(`Unsupported source subscription ${listenType}`);
    }
}

function isPageHidden(): boolean {
    return (globalThis as unknown as { document?: { visibilityState?: string } }).document?.visibilityState === 'hidden';
}

function toError(value: unknown): Error {
    return value instanceof Error ? value : new Error(String(value));
}
