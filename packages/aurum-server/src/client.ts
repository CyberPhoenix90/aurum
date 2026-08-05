import { CancellationToken } from '@aurum/streams';
import { RemoteMessage, RemoteProtocol, createRemoteMessage } from '@aurum/remote/protocol';
import ws from 'ws';
import { Session } from './session.js';

export interface ClientTransportConfig {
    batchDelayMs: number;
    maxBufferedAmount: number;
    maxQueueBytes: number;
    onError(error: Error): void;
}

const batchableTypes = new Set<RemoteProtocol>([
    RemoteProtocol.UPDATE_DATASOURCE,
    RemoteProtocol.UPDATE_DUPLEX_DATASOURCE,
    RemoteProtocol.UPDATE_ARRAY_DATASOURCE,
    RemoteProtocol.UPDATE_MAP_DATASOURCE,
    RemoteProtocol.UPDATE_OBJECT_DATASOURCE,
    RemoteProtocol.UPDATE_SET_DATASOURCE,
    RemoteProtocol.SUBSCRIPTION_ACK
]);

export class Client<T> {
    public readonly mapdsSubscriptions = new Map<string, CancellationToken>();
    public readonly dsSubscriptions = new Map<string, CancellationToken>();
    public readonly adsSubscriptions = new Map<string, CancellationToken>();
    public readonly ddsSubscriptions = new Map<string, CancellationToken>();
    public readonly odsSubscriptions = new Map<string, CancellationToken>();
    public readonly setdsSubscriptions = new Map<string, CancellationToken>();
    public readonly rpcTokens = new Map<string, CancellationToken>();
    public readonly connectionToken = new CancellationToken();
    public readonly connection: ws;
    public timeSinceLastMessage = Date.now();
    public session: Session<T>;
    public handshaken = false;
    public messagesInWindow = 0;
    public messageWindowStartedAt = Date.now();
    private readonly transport: ClientTransportConfig;
    private queue: RemoteMessage[] = [];
    private queueBytes = 0;
    private flushTimer?: ReturnType<typeof setTimeout>;
    private disposed = false;

    public constructor(connection: ws, transport: ClientTransportConfig) {
        this.connection = connection;
        this.transport = transport;
    }

    public get subscriptionCount(): number {
        return (
            this.mapdsSubscriptions.size +
            this.dsSubscriptions.size +
            this.adsSubscriptions.size +
            this.ddsSubscriptions.size +
            this.odsSubscriptions.size +
            this.setdsSubscriptions.size
        );
    }

    public sendMessage(messageType: RemoteProtocol, payload: Omit<RemoteMessage, 'version' | 'type'> = {}): void {
        if (this.disposed || this.connection.readyState !== 1) {
            return;
        }
        const message = createRemoteMessage(messageType, payload);
        if (!batchableTypes.has(messageType)) {
            this.flush();
            this.sendNow(message);
            return;
        }
        const size = Buffer.byteLength(JSON.stringify(message));
        if (this.queueBytes + size > this.transport.maxQueueBytes) {
            this.transport.onError(new Error(`Client outbound queue exceeded ${this.transport.maxQueueBytes} bytes`));
            this.connection.close(1013, 'outbound queue limit exceeded');
            return;
        }
        this.queue.push(message);
        this.queueBytes += size;
        if (!this.flushTimer) {
            this.flushTimer = setTimeout(() => {
                this.flushTimer = undefined;
                this.flush();
            }, this.transport.batchDelayMs);
        }
    }

    public flush(): void {
        if (this.queue.length === 0 || this.disposed || this.connection.readyState !== 1) {
            return;
        }
        if (this.connection.bufferedAmount > this.transport.maxBufferedAmount) {
            if (!this.flushTimer) {
                this.flushTimer = setTimeout(() => {
                    this.flushTimer = undefined;
                    this.flush();
                }, Math.max(1, this.transport.batchDelayMs));
            }
            return;
        }
        const queued = this.queue;
        this.queue = [];
        this.queueBytes = 0;
        this.sendNow(queued.length === 1 ? queued[0] : createRemoteMessage(RemoteProtocol.BATCH, { messages: queued }));
    }

    public dispose(closeConnection = true): void {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        clearTimeout(this.flushTimer);
        for (const subscriptions of this.subscriptionMaps()) {
            for (const subscription of subscriptions.values()) {
                subscription.cancel();
            }
            subscriptions.clear();
        }
        for (const token of this.rpcTokens.values()) {
            token.cancel();
        }
        this.rpcTokens.clear();
        this.connectionToken.cancel();
        if (closeConnection && this.connection.readyState < 2) {
            this.connection.close(1000, 'session terminated');
        }
    }

    private sendNow(message: RemoteMessage): void {
        try {
            this.connection.send(JSON.stringify(message), (error) => {
                if (error) {
                    this.transport.onError(error);
                }
            });
        } catch (error) {
            this.transport.onError(toError(error));
        }
    }

    private subscriptionMaps(): Array<Map<string, CancellationToken>> {
        return [
            this.mapdsSubscriptions,
            this.dsSubscriptions,
            this.adsSubscriptions,
            this.ddsSubscriptions,
            this.odsSubscriptions,
            this.setdsSubscriptions
        ];
    }
}

function toError(value: unknown): Error {
    return value instanceof Error ? value : new Error(String(value));
}
