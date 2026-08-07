import {
    CancellationToken,
    CollectionChange,
    DuplexDataSource,
    MapDataSource,
    ReadOnlyArrayDataSource,
    ReadOnlyDataSource,
    ReadOnlyObjectDataSource,
    ReadOnlySetDataSource
} from '@aurum/streams';
import { RemoteMessage, RemoteProtocol, ProtocolError, decodeRemoteMessages } from '@aurum/remote/protocol';
import { Server as HttpServer, IncomingMessage } from 'http';
import { Server as HttpsServer } from 'https';
import ws from 'ws';
import { Client } from './client.js';
import { Endpoint, ExposeConfig, ExposeFunctionConfig, Router, RPCEndpoint } from './router.js';
import { Session } from './session.js';

export interface AurumServerConfig<T> {
    reuseServer?: HttpServer | HttpsServer;
    port?: number;
    host?: string;
    path?: string;
    maxMessageSize?: number;
    maxMessagesPerSecond?: number;
    maxSubscriptionsPerClient?: number;
    maxConcurrentRPCPerClient?: number;
    maxBufferedAmount?: number;
    maxQueueBytes?: number;
    batchDelayMs?: number;
    closeGracePeriodMs?: number;
    exposeInternalErrors?: boolean;
    authenticateConnection?: (request: IncomingMessage) => boolean | Promise<boolean>;
    onClientConnected?: (session: Session<T>) => void;
    onClientDisconnected?: (session: Session<T>) => void;
    onError?: (session: Session<T> | undefined, error: Error) => void;
}

interface NormalizedConfig<T> extends Required<Omit<AurumServerConfig<T>, 'reuseServer' | 'host' | 'path' | 'onClientConnected' | 'onClientDisconnected' | 'onError'>> {
    reuseServer?: HttpServer | HttpsServer;
    host?: string;
    path?: string;
    onClientConnected?: (session: Session<T>) => void;
    onClientDisconnected?: (session: Session<T>) => void;
    onError?: (session: Session<T> | undefined, error: Error) => void;
}

export class AurumServer<T = void> {
    private readonly wsServer: ws.Server;
    private readonly wsServerClients: Client<T>[] = [];
    private readonly config: NormalizedConfig<T>;
    private readonly routers = new Map<string, Router>();
    private readonly readyPromise: Promise<void>;
    private closePromise?: Promise<void>;
    private closing = false;

    private constructor(config: AurumServerConfig<T>) {
        this.config = normalizeConfig(config);
        const rootRouter = new Router();
        rootRouter.attach(this.wsServerClients);
        this.routers.set('', rootRouter);

        const serverOptions: ws.ServerOptions = this.config.reuseServer
            ? { server: this.config.reuseServer, path: this.config.path, maxPayload: this.config.maxMessageSize }
            : {
                  port: this.config.port,
                  host: this.config.host,
                  path: this.config.path,
                  maxPayload: this.config.maxMessageSize
              };
        this.wsServer = new ws.Server(serverOptions);
        this.readyPromise = new Promise((resolve, reject) => {
            const onListening = () => {
                cleanup();
                resolve();
            };
            const onError = (error: Error) => {
                cleanup();
                reject(error);
            };
            const cleanup = () => {
                this.wsServer.removeListener('listening', onListening);
                this.wsServer.removeListener('error', onError);
            };
            this.wsServer.once('listening', onListening);
            this.wsServer.once('error', onError);
            if (this.config.reuseServer?.listening) {
                queueMicrotask(onListening);
            }
        });
        this.wsServer.on('connection', (connection, request) => this.acceptConnection(connection, request));
        this.wsServer.on('error', (error) => this.reportError(undefined, error));
    }

    public static create<T = void>(config: AurumServerConfig<T> = {}): AurumServer<T> {
        return new AurumServer(config);
    }

    public static async start<T = void>(config: AurumServerConfig<T> = {}): Promise<AurumServer<T>> {
        const server = new AurumServer(config);
        await server.whenReady();
        return server;
    }

    public whenReady(): Promise<void> {
        return this.readyPromise;
    }

    public address(): ws.AddressInfo | string | null {
        return this.wsServer.address();
    }

    public getSessions(): ReadonlyArray<Session<T>> {
        return this.wsServerClients.map((client) => client.session);
    }

    public exposeRouter(route: string, router: Router, cancellationToken?: CancellationToken): void {
        const normalizedRoute = normalizeRoute(route);
        if (this.routers.has(normalizedRoute)) {
            throw new Error(`Router ${normalizedRoute} is already exposed`);
        }
        this.routers.set(normalizedRoute, router);
        router.attach(this.wsServerClients, normalizedRoute);
        cancellationToken?.addCancellable(() => this.removeRouter(normalizedRoute));
    }

    public removeRouter(route: string): void {
        const normalizedRoute = normalizeRoute(route);
        if (!normalizedRoute) {
            throw new Error('The root router cannot be removed');
        }
        const router = this.routers.get(normalizedRoute);
        if (router) {
            this.routers.delete(normalizedRoute);
            router.clear();
        }
    }

    public async close(): Promise<void> {
        if (this.closePromise) {
            return this.closePromise;
        }
        this.closing = true;
        this.closePromise = (async () => {
            for (const client of [...this.wsServerClients]) {
                client.dispose();
            }
            const terminationTimer = setTimeout(() => {
                for (const connection of this.wsServer.clients) {
                    connection.terminate();
                }
            }, this.config.closeGracePeriodMs);
            await new Promise<void>((resolve, reject) => {
                this.wsServer.close((error) => (error ? reject(error) : resolve()));
            }).finally(() => clearTimeout(terminationTimer));
        })();
        return this.closePromise;
    }

    public exposeSetDataSource<I>(id: string, source: ReadOnlySetDataSource<I>, config: ExposeConfig = {}): void {
        this.rootRouter.exposeSetDataSource(id, source, config);
    }

    public exposeObjectDataSource<I extends object>(id: string, source: ReadOnlyObjectDataSource<I>, config: ExposeConfig = {}): void {
        this.rootRouter.exposeObjectDataSource(id, source, config);
    }

    public exposeFunction<I, O>(
        id: string,
        func: (input: I, session: Session<T>, cancellationToken: CancellationToken) => O | Promise<O>,
        config: ExposeFunctionConfig = {}
    ): void {
        this.rootRouter.exposeFunction(id, func, config);
    }

    public exposeDataSource<I>(id: string, source: ReadOnlyDataSource<I>, config: ExposeConfig = {}): void {
        this.rootRouter.exposeDataSource(id, source, config);
    }

    public exposeMapDataSource<K, V>(id: string, source: MapDataSource<K, V>, config: ExposeConfig = {}): void {
        this.rootRouter.exposeMapDataSource(id, source, config);
    }

    public exposeArrayDataSource<I>(id: string, source: ReadOnlyArrayDataSource<I>, config: ExposeConfig = {}): void {
        this.rootRouter.exposeArrayDataSource(id, source, config);
    }

    public exposeDuplexDataSource<I>(id: string, source: DuplexDataSource<I>, config: ExposeConfig = {}): void {
        this.rootRouter.exposeDuplexDataSource(id, source, config);
    }

    private get rootRouter(): Router {
        return this.routers.get('')!;
    }

    private acceptConnection(connection: ws, request: IncomingMessage): void {
        let client: Client<T>;
        client = new Client<T>(connection, {
            batchDelayMs: this.config.batchDelayMs,
            maxBufferedAmount: this.config.maxBufferedAmount,
            maxQueueBytes: this.config.maxQueueBytes,
            onError: (error) => this.reportError(client?.session, error)
        });
        client.session = new Session<T>(client, client.connectionToken);
        const pendingMessages: ws.Data[] = [];
        let authorized = false;
        let disconnected = false;

        connection.on('message', (data) => {
            if (!authorized) {
                pendingMessages.push(data);
                return;
            }
            this.enqueueMessage(client, data);
        });
        connection.once('close', () => {
            disconnected = true;
            const index = this.wsServerClients.indexOf(client);
            if (index !== -1) {
                this.wsServerClients.splice(index, 1);
            }
            client.dispose(false);
            this.config.onClientDisconnected?.(client.session);
        });
        connection.on('error', (error) => this.reportError(client.session, error));

        Promise.resolve(this.config.authenticateConnection(request))
            .then((accepted) => {
                if (!accepted || disconnected) {
                    if (!disconnected) {
                        connection.close(1008, 'connection unauthorized');
                    }
                    return;
                }
                authorized = true;
                this.wsServerClients.push(client);
                this.config.onClientConnected?.(client.session);
                pendingMessages.splice(0).forEach((data) => this.enqueueMessage(client, data));
            })
            .catch((error) => {
                this.reportError(client.session, toError(error));
                connection.close(1011, 'connection authentication failed');
            });
    }

    private enqueueMessage(client: Client<T>, data: ws.Data): void {
        const previous = (client as Client<T> & { processing?: Promise<void> }).processing ?? Promise.resolve();
        (client as Client<T> & { processing?: Promise<void> }).processing = previous
            .then(() => this.processFrame(client, data))
            .catch((error) => this.reportError(client.session, toError(error)));
    }

    private async processFrame(sender: Client<T>, data: ws.Data): Promise<void> {
        let messages: RemoteMessage[];
        try {
            const payload = normalizeData(data);
            messages = decodeRemoteMessages(payload, this.config.maxMessageSize);
        } catch (error) {
            const protocolError = toError(error);
            this.reportError(sender.session, protocolError);
            sender.sendMessage(RemoteProtocol.PROTOCOL_ERROR, { errorCode: 400, error: protocolError.message });
            sender.connection.close(error instanceof ProtocolError ? 1002 : 1007, 'invalid protocol message');
            return;
        }
        if (!this.consumeMessageBudget(sender, messages.length)) {
            return;
        }
        for (const message of messages) {
            sender.timeSinceLastMessage = Date.now();
            if (!sender.handshaken) {
                if (message.type !== RemoteProtocol.HELLO) {
                    sender.connection.close(1002, 'protocol handshake required');
                    return;
                }
                sender.handshaken = true;
                sender.sendMessage(RemoteProtocol.HELLO_ACK);
                continue;
            }
            await this.processMessage(sender, message);
        }
    }

    private consumeMessageBudget(client: Client<T>, count: number): boolean {
        const now = Date.now();
        if (now - client.messageWindowStartedAt >= 1_000) {
            client.messageWindowStartedAt = now;
            client.messagesInWindow = 0;
        }
        client.messagesInWindow += count;
        if (client.messagesInWindow > this.config.maxMessagesPerSecond) {
            client.connection.close(1008, 'message rate limit exceeded');
            return false;
        }
        return true;
    }

    private async processMessage(sender: Client<T>, message: RemoteMessage): Promise<void> {
        switch (message.type) {
            case RemoteProtocol.HEARTBEAT:
                sender.sendMessage(RemoteProtocol.HEARTBEAT);
                return;
            case RemoteProtocol.CANCEL_DATASOURCE:
                return cancelSubscription(sender.dsSubscriptions, message.id!);
            case RemoteProtocol.CANCEL_ARRAY_DATASOURCE:
                return cancelSubscription(sender.adsSubscriptions, message.id!);
            case RemoteProtocol.CANCEL_DUPLEX_DATASOURCE:
                return cancelSubscription(sender.ddsSubscriptions, message.id!);
            case RemoteProtocol.CANCEL_MAP_DATASOURCE:
                return cancelSubscription(sender.mapdsSubscriptions, message.id!);
            case RemoteProtocol.CANCEL_SET_DATASOURCE:
                return cancelSubscription(sender.setdsSubscriptions, message.id!);
            case RemoteProtocol.CANCEL_OBJECT_DATASOURCE:
                return cancelSubscription(sender.odsSubscriptions, message.id!);
            case RemoteProtocol.CANCEL_RPC:
                sender.rpcTokens.get(message.uuid!)?.cancel();
                sender.rpcTokens.delete(message.uuid!);
                return;
            case RemoteProtocol.LISTEN_DATASOURCE:
                return this.listenDataSource(message, sender);
            case RemoteProtocol.LISTEN_ARRAY_DATASOURCE:
                return this.listenArrayDataSource(message, sender);
            case RemoteProtocol.LISTEN_DUPLEX_DATASOURCE:
                return this.listenDuplexDataSource(message, sender);
            case RemoteProtocol.LISTEN_MAP_DATASOURCE:
                return this.listenMapDataSource(message, sender);
            case RemoteProtocol.LISTEN_OBJECT_DATASOURCE:
                return this.listenObjectDataSource(message, sender);
            case RemoteProtocol.LISTEN_SET_DATASOURCE:
                return this.listenSetDataSource(message, sender);
            case RemoteProtocol.UPDATE_DUPLEX_DATASOURCE:
                return this.updateDuplexDataSource(message, sender);
            case RemoteProtocol.UPDATE_MAP_DATASOURCE:
                return this.updateMapDataSource(message, sender);
            case RemoteProtocol.PERFORM_RPC:
                void this.performRPC(message, sender).catch((error) => this.reportError(sender.session, toError(error)));
                return;
            default:
                sender.sendMessage(RemoteProtocol.PROTOCOL_ERROR, { errorCode: 400, error: `Message ${message.type} is not valid from a client` });
        }
    }

    private async performRPC(message: RemoteMessage, sender: Client<T>): Promise<void> {
        const endpoint = this.getExposedFunction(message.id!);
        if (!endpoint) {
            sender.sendMessage(RemoteProtocol.PERFORM_RPC_ERR, rpcError(message, 404, `Function ${message.id} not found`));
            return;
        }
        if (sender.rpcTokens.has(message.uuid!)) {
            sender.sendMessage(RemoteProtocol.PERFORM_RPC_ERR, rpcError(message, 409, 'RPC request id is already active'));
            return;
        }
        if (sender.rpcTokens.size >= this.config.maxConcurrentRPCPerClient) {
            sender.sendMessage(RemoteProtocol.PERFORM_RPC_ERR, rpcError(message, 429, 'Too many concurrent RPC calls'));
            return;
        }
        const cancellationToken = new CancellationToken();
        sender.rpcTokens.set(message.uuid!, cancellationToken);
        try {
            if (!(await this.authenticate(endpoint, message.token, undefined, sender, RemoteProtocol.PERFORM_RPC_ERR, message))) {
                return;
            }
            if (cancellationToken.isCancelled) {
                return;
            }
            const result = await endpoint.func(message.value, sender.session, cancellationToken);
            if (!cancellationToken.isCancelled) {
                sender.sendMessage(RemoteProtocol.PERFORM_RPC_RESULT, { id: message.id, uuid: message.uuid, result });
            }
        } catch (error) {
            if (!cancellationToken.isCancelled) {
                sender.sendMessage(
                    RemoteProtocol.PERFORM_RPC_ERR,
                    rpcError(message, 500, this.config.exposeInternalErrors ? toError(error).message : 'Internal server error')
                );
                this.reportError(sender.session, toError(error));
            }
        } finally {
            sender.rpcTokens.delete(message.uuid!);
            cancellationToken.cancel();
        }
    }

    private async listenDataSource(message: RemoteMessage, sender: Client<T>): Promise<void> {
        const endpoint = this.getExposedDataSource(message.id!);
        await this.subscribe(message, sender, endpoint, sender.dsSubscriptions, RemoteProtocol.LISTEN_DATASOURCE_ERR, (token) => {
            endpoint!.source.listenAndRepeat((value) => sender.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: message.id, value }), token);
        });
    }

    private async listenArrayDataSource(message: RemoteMessage, sender: Client<T>): Promise<void> {
        const endpoint = this.getExposedArrayDataSource(message.id!);
        await this.subscribe(message, sender, endpoint, sender.adsSubscriptions, RemoteProtocol.LISTEN_ARRAY_DATASOURCE_ERR, (token) => {
            let revision = 0;
            endpoint!.source.listen((sourceChange) => {
                const change = { ...sourceChange } as Partial<CollectionChange<any>>;
                delete change.operation;
                delete change.previousState;
                delete change.newState;
                sender.sendMessage(RemoteProtocol.UPDATE_ARRAY_DATASOURCE, { id: message.id, change, revision: ++revision, snapshot: false });
            }, token);
            sender.sendMessage(RemoteProtocol.UPDATE_ARRAY_DATASOURCE, {
                id: message.id,
                change: { operationDetailed: 'merge', items: Array.from(endpoint!.source.getData()) },
                revision,
                snapshot: true
            });
        });
    }

    private async listenDuplexDataSource(message: RemoteMessage, sender: Client<T>): Promise<void> {
        const endpoint = this.getExposedDuplexDataSource(message.id!);
        await this.subscribe(message, sender, endpoint, sender.ddsSubscriptions, RemoteProtocol.LISTEN_DUPLEX_DATASOURCE_ERR, (token) => {
            endpoint!.source.listenAndRepeat((value) => sender.sendMessage(RemoteProtocol.UPDATE_DUPLEX_DATASOURCE, { id: message.id, value }), token);
        });
    }

    private async listenMapDataSource(message: RemoteMessage, sender: Client<T>): Promise<void> {
        const endpoint = this.getExposedMapDataSource(message.id!);
        await this.subscribe(message, sender, endpoint, sender.mapdsSubscriptions, RemoteProtocol.LISTEN_MAP_DATASOURCE_ERR, (token) => {
            endpoint!.source.listenAndRepeat((sourceChange) => {
                const change = { ...sourceChange } as Record<string, unknown>;
                delete change.oldValue;
                sender.sendMessage(RemoteProtocol.UPDATE_MAP_DATASOURCE, { id: message.id, change });
            }, token);
        });
    }

    private async listenObjectDataSource(message: RemoteMessage, sender: Client<T>): Promise<void> {
        const endpoint = this.getExposedObjectDataSource(message.id!);
        await this.subscribe(message, sender, endpoint, sender.odsSubscriptions, RemoteProtocol.LISTEN_OBJECT_DATASOURCE_ERR, (token) => {
            endpoint!.source.listenAndRepeat((sourceChange) => {
                const change = { ...sourceChange } as Record<string, unknown>;
                delete change.oldValue;
                sender.sendMessage(RemoteProtocol.UPDATE_OBJECT_DATASOURCE, { id: message.id, change });
            }, token);
        });
    }

    private async listenSetDataSource(message: RemoteMessage, sender: Client<T>): Promise<void> {
        const endpoint = this.getExposedSetDataSource(message.id!);
        await this.subscribe(message, sender, endpoint, sender.setdsSubscriptions, RemoteProtocol.LISTEN_SET_DATASOURCE_ERR, (token) => {
            endpoint!.source.listenAndRepeat((change) => sender.sendMessage(RemoteProtocol.UPDATE_SET_DATASOURCE, { id: message.id, change }), token);
        });
    }

    private async subscribe<S>(
        message: RemoteMessage,
        sender: Client<T>,
        endpoint: Endpoint<S> | undefined,
        subscriptions: Map<string, CancellationToken>,
        errorType: RemoteProtocol,
        listen: (token: CancellationToken) => void
    ): Promise<void> {
        if (subscriptions.has(message.id!)) {
            sender.sendMessage(RemoteProtocol.SUBSCRIPTION_ACK, { id: message.id, subscriptionType: message.type });
            return;
        }
        if (!endpoint) {
            sender.sendMessage(errorType, { id: message.id, errorCode: 404, error: 'No such endpoint' });
            return;
        }
        if (!(await this.authenticate(endpoint, message.token, 'read', sender, errorType, message))) {
            return;
        }
        if (sender.subscriptionCount >= this.config.maxSubscriptionsPerClient) {
            sender.sendMessage(errorType, { id: message.id, errorCode: 429, error: 'Subscription limit reached' });
            return;
        }
        const token = new CancellationToken();
        subscriptions.set(message.id!, token);
        try {
            listen(token);
            sender.sendMessage(RemoteProtocol.SUBSCRIPTION_ACK, { id: message.id, subscriptionType: message.type });
        } catch (error) {
            subscriptions.delete(message.id!);
            token.cancel();
            throw error;
        }
    }

    private async updateMapDataSource(message: RemoteMessage, sender: Client<T>): Promise<void> {
        const endpoint = this.getExposedMapDataSource(message.id!);
        if (!endpoint) {
            sender.sendMessage(RemoteProtocol.UPDATE_MAP_DATASOURCE_ERR, { id: message.id, errorCode: 404, error: 'No such map data source' });
            return;
        }
        if (await this.authenticate(endpoint, message.token, 'write', sender, RemoteProtocol.UPDATE_MAP_DATASOURCE_ERR, message)) {
            endpoint.source.applyMapChange(message.value as any);
        }
    }

    private async updateDuplexDataSource(message: RemoteMessage, sender: Client<T>): Promise<void> {
        const endpoint = this.getExposedDuplexDataSource(message.id!);
        if (!endpoint) {
            sender.sendMessage(RemoteProtocol.UPDATE_DUPLEX_DATASOURCE_ERR, { id: message.id, errorCode: 404, error: 'No such duplex data source' });
            return;
        }
        if (await this.authenticate(endpoint, message.token, 'write', sender, RemoteProtocol.UPDATE_DUPLEX_DATASOURCE_ERR, message)) {
            endpoint.source.updateUpstream(message.value);
        }
    }

    private async authenticate(
        endpoint: Endpoint<unknown, any> | RPCEndpoint<any, any>,
        token: string | undefined,
        operation: 'read' | 'write' | undefined,
        sender: Client<T>,
        errorType: RemoteProtocol,
        message: RemoteMessage
    ): Promise<boolean> {
        try {
            const accepted = operation === undefined ? await (endpoint as RPCEndpoint<any, any>).authenticator(token) : await (endpoint as Endpoint<unknown>).authenticator(token, operation);
            if (!accepted) {
                sender.sendMessage(errorType, {
                    id: message.id,
                    uuid: message.uuid,
                    errorCode: 401,
                    error: 'Unauthorized'
                });
            }
            return accepted;
        } catch (error) {
            this.reportError(sender.session, toError(error));
            sender.sendMessage(errorType, { id: message.id, uuid: message.uuid, errorCode: 500, error: 'Authentication failed' });
            return false;
        }
    }

    private getExposedFunction(id: string): RPCEndpoint<any, any> | undefined {
        return this.resolve(id, (router, endpointId) => router.getExposedFunction(endpointId));
    }
    private getExposedDataSource(id: string): Endpoint<ReadOnlyDataSource<any>> | undefined {
        return this.resolve(id, (router, endpointId) => router.getExposedDataSource(endpointId));
    }
    private getExposedArrayDataSource(id: string): Endpoint<ReadOnlyArrayDataSource<any>> | undefined {
        return this.resolve(id, (router, endpointId) => router.getExposedArrayDataSource(endpointId));
    }
    private getExposedMapDataSource(id: string): Endpoint<MapDataSource<any, any>> | undefined {
        return this.resolve(id, (router, endpointId) => router.getExposedMapDataSource(endpointId));
    }
    private getExposedObjectDataSource(id: string): Endpoint<ReadOnlyObjectDataSource<any>> | undefined {
        return this.resolve(id, (router, endpointId) => router.getExposedObjectDataSource(endpointId));
    }
    private getExposedSetDataSource(id: string): Endpoint<ReadOnlySetDataSource<any>> | undefined {
        return this.resolve(id, (router, endpointId) => router.getExposedSetDataSource(endpointId));
    }
    private getExposedDuplexDataSource(id: string): Endpoint<DuplexDataSource<any>> | undefined {
        return this.resolve(id, (router, endpointId) => router.getExposedDuplexDataSource(endpointId));
    }

    private resolve<R>(id: string, lookup: (router: Router, endpointId: string) => R | undefined): R | undefined {
        const routes = [...this.routers.keys()].filter(Boolean).sort((left, right) => right.length - left.length);
        for (const route of routes) {
            if (id.startsWith(route)) {
                const result = lookup(this.routers.get(route)!, id.slice(route.length));
                if (result !== undefined) {
                    return result;
                }
            }
        }
        return lookup(this.rootRouter, id);
    }

    private reportError(session: Session<T> | undefined, error: Error): void {
        if (this.config.onError) {
            this.config.onError(session, error);
        } else if (!this.closing) {
            console.error(error);
        }
    }
}

function normalizeConfig<T>(config: AurumServerConfig<T>): NormalizedConfig<T> {
    return {
        reuseServer: config.reuseServer,
        port: config.port ?? 8080,
        host: config.host,
        path: config.path,
        maxMessageSize: config.maxMessageSize ?? 1_048_576,
        maxMessagesPerSecond: config.maxMessagesPerSecond ?? 1_000,
        maxSubscriptionsPerClient: config.maxSubscriptionsPerClient ?? 1_000,
        maxConcurrentRPCPerClient: config.maxConcurrentRPCPerClient ?? 100,
        maxBufferedAmount: config.maxBufferedAmount ?? 1_048_576,
        maxQueueBytes: config.maxQueueBytes ?? 4_194_304,
        batchDelayMs: config.batchDelayMs ?? 0,
        closeGracePeriodMs: config.closeGracePeriodMs ?? 1_000,
        exposeInternalErrors: config.exposeInternalErrors ?? false,
        authenticateConnection: config.authenticateConnection ?? (() => true),
        onClientConnected: config.onClientConnected,
        onClientDisconnected: config.onClientDisconnected,
        onError: config.onError
    };
}

function normalizeRoute(route: string): string {
    const trimmed = route.replace(/^\/+|\/+$/g, '');
    return trimmed ? `${trimmed}/` : '';
}

function cancelSubscription(subscriptions: Map<string, CancellationToken>, id: string): void {
    subscriptions.get(id)?.cancel();
    subscriptions.delete(id);
}

function normalizeData(data: ws.Data): string | ArrayBuffer | ArrayBufferView {
    if (typeof data === 'string' || data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        return data;
    }
    if (Array.isArray(data)) {
        return Buffer.concat(data);
    }
    throw new ProtocolError('Unsupported WebSocket payload type');
}

function rpcError(message: RemoteMessage, errorCode: number, error: string): Omit<RemoteMessage, 'version' | 'type'> {
    return { id: message.id, uuid: message.uuid, errorCode, error };
}

function toError(value: unknown): Error {
    return value instanceof Error ? value : new Error(String(value));
}
