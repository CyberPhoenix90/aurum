import { CancellationToken } from '@aurumjs/streams';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    RemoteClient,
    WebSocketLike,
    createRemoteArrayDataSource,
    createRemoteDataSource,
    createRemoteDuplexDataSource,
    createRemoteMapDataSource,
    createRemoteObjectDataSource,
    createRemoteSetDataSource,
    getRemoteFunction
} from '../src/remote_client.js';
import { RemoteMessage, RemoteProtocol, createRemoteMessage } from '../src/protocol.js';

class TestWebSocket implements WebSocketLike {
    public static readonly instances: TestWebSocket[] = [];

    public readyState = 0;
    public readonly sent: RemoteMessage[] = [];
    public readonly closes: Array<{ code?: number; reason?: string }> = [];
    private readonly listeners = new Map<string, Set<(event: any) => void>>();

    public constructor(public readonly url: string) {
        TestWebSocket.instances.push(this);
    }

    public send(data: string): void {
        this.sent.push(JSON.parse(data) as RemoteMessage);
    }

    public close(code?: number, reason?: string): void {
        this.closes.push({ code, reason });
        this.serverClose();
    }

    public addEventListener(type: string, listener: (event: any) => void): void {
        const listeners = this.listeners.get(type) ?? new Set();
        listeners.add(listener);
        this.listeners.set(type, listeners);
    }

    public removeEventListener(type: string, listener: (event: any) => void): void {
        this.listeners.get(type)?.delete(listener);
    }

    public open(): void {
        this.readyState = 1;
        this.emit('open', {});
    }

    public receive(message: RemoteMessage): void {
        this.receiveRaw(JSON.stringify(message));
    }

    public receiveRaw(data: string): void {
        this.emit('message', { data });
    }

    public fail(): void {
        this.emit('error', {});
    }

    public serverClose(): void {
        if (this.readyState === 3) return;
        this.readyState = 3;
        this.emit('close', {});
    }

    private emit(type: string, event: unknown): void {
        for (const listener of [...(this.listeners.get(type) ?? [])]) {
            listener(event);
        }
    }
}

const clients: RemoteClient[] = [];

function last<Item>(items: readonly Item[]): Item {
    return items[items.length - 1];
}

afterEach(() => {
    clients.splice(0).forEach((client) => client.close());
    TestWebSocket.instances.splice(0);
    vi.useRealTimers();
});

async function connect(options: Partial<Parameters<typeof RemoteClient.connect>[0]> = {}): Promise<{
    client: RemoteClient;
    socket: TestWebSocket;
}> {
    const pending = RemoteClient.connect({
        url: 'ws://test.invalid/socket',
        webSocketFactory: TestWebSocket,
        reconnect: false,
        heartbeatIntervalMs: 60_000,
        heartbeatTimeoutMs: 120_000,
        ...options
    });
    const socket = TestWebSocket.instances[TestWebSocket.instances.length - 1];
    socket.open();
    expect(socket.sent).toEqual([createRemoteMessage(RemoteProtocol.HELLO)]);
    socket.receive(createRemoteMessage(RemoteProtocol.HELLO_ACK));
    const client = await pending;
    clients.push(client);
    return { client, socket };
}

describe('RemoteClient', () => {
    it('handshakes, reports malformed frames, probes a healthy connection, and closes idempotently', async () => {
        const { client, socket } = await connect();
        const errors: string[] = [];
        client.errors.subscribe((error) => errors.push(error.message));

        expect(client.isConnected).toBe(true);
        socket.receiveRaw('{not-json');
        expect(errors).toEqual(['Message is not valid JSON']);

        client.probe();
        expect(last(socket.sent).type).toBe(RemoteProtocol.HEARTBEAT);
        client.close(3001, 'finished');
        client.close(3002, 'ignored');

        expect(client.isConnected).toBe(false);
        expect(socket.closes).toEqual([{ code: 3001, reason: 'finished' }]);
        await expect(client.call('after-close', undefined)).rejects.toThrow('not connected');
    });

    it('resolves, rejects, cancels, and times out RPC calls using request ids from the wire', async () => {
        vi.useFakeTimers();
        const { client, socket } = await connect({ rpcTimeoutMs: 50 });
        const remoteDouble = getRemoteFunction<number, number>(client, 'double', { token: 'secret' });
        const success = remoteDouble(4);
        const successRequest = last(socket.sent);
        expect(successRequest).toMatchObject({ type: RemoteProtocol.PERFORM_RPC, id: 'double', token: 'secret', value: 4 });
        socket.receive(
            createRemoteMessage(RemoteProtocol.PERFORM_RPC_RESULT, {
                id: 'double',
                uuid: successRequest.uuid,
                result: 8
            })
        );
        await expect(success).resolves.toBe(8);

        const failure = client.call('broken', undefined);
        const failureRequest = last(socket.sent);
        socket.receive(
            createRemoteMessage(RemoteProtocol.PERFORM_RPC_RESULT_ERR, {
                id: 'broken',
                uuid: failureRequest.uuid,
                error: 'remote failure'
            })
        );
        await expect(failure).rejects.toThrow('remote failure');

        const cancellationToken = new CancellationToken();
        const cancelled = client.call('slow', undefined, { cancellationToken, timeoutMs: 1_000 });
        const cancelledRequest = last(socket.sent);
        const cancelledExpectation = expect(cancelled).rejects.toThrow('was cancelled');
        cancellationToken.cancel();
        await cancelledExpectation;
        expect(last(socket.sent)).toMatchObject({ type: RemoteProtocol.CANCEL_RPC, id: 'slow', uuid: cancelledRequest.uuid });

        const timedOut = client.call('timeout', undefined, { timeoutMs: 25 });
        const timeoutRequest = last(socket.sent);
        const timeoutExpectation = expect(timedOut).rejects.toThrow('timed out after 25ms');
        await vi.advanceTimersByTimeAsync(25);
        await timeoutExpectation;
        expect(last(socket.sent)).toMatchObject({ type: RemoteProtocol.CANCEL_RPC, id: 'timeout', uuid: timeoutRequest.uuid });
    });

    it('creates and updates every remote source type and forwards duplex writes upstream', async () => {
        const { client, socket } = await connect();
        const cancellationToken = new CancellationToken();
        const options = { cancellationToken, token: 'source-token' };
        const scalar = createRemoteDataSource(client, 'scalar', options, 0);
        const duplex = createRemoteDuplexDataSource(client, 'duplex', options, 'initial');
        const array = createRemoteArrayDataSource(client, 'array', options, [0]);
        const map = createRemoteMapDataSource(client, 'map', options, new Map([['initial', 0]]));
        const object = createRemoteObjectDataSource(client, 'object', options, { value: 0 });
        const set = createRemoteSetDataSource(client, 'set', options, ['initial']);

        expect(socket.sent.slice(-6).map((message) => message.type)).toEqual([
            RemoteProtocol.LISTEN_DATASOURCE,
            RemoteProtocol.LISTEN_DUPLEX_DATASOURCE,
            RemoteProtocol.LISTEN_ARRAY_DATASOURCE,
            RemoteProtocol.LISTEN_MAP_DATASOURCE,
            RemoteProtocol.LISTEN_OBJECT_DATASOURCE,
            RemoteProtocol.LISTEN_SET_DATASOURCE
        ]);

        socket.receive(createRemoteMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: 'scalar', value: 1 }));
        socket.receive(createRemoteMessage(RemoteProtocol.UPDATE_DUPLEX_DATASOURCE, { id: 'duplex', value: 'downstream' }));
        socket.receive(
            createRemoteMessage(RemoteProtocol.UPDATE_ARRAY_DATASOURCE, {
                id: 'array',
                change: { operationDetailed: 'merge', items: [1, 2] },
                revision: 0,
                snapshot: true
            })
        );
        socket.receive(
            createRemoteMessage(RemoteProtocol.UPDATE_MAP_DATASOURCE, {
                id: 'map',
                change: { key: 'remote', newValue: 2, deleted: false }
            })
        );
        socket.receive(
            createRemoteMessage(RemoteProtocol.UPDATE_OBJECT_DATASOURCE, {
                id: 'object',
                change: { operation: 'set', key: 'value', newValue: 3, deleted: false }
            })
        );
        socket.receive(createRemoteMessage(RemoteProtocol.UPDATE_SET_DATASOURCE, { id: 'set', change: { key: 'remote', exists: true } }));

        expect(scalar.value).toBe(1);
        expect(duplex.value).toBe('downstream');
        expect(array.getData()).toEqual([1, 2]);
        expect(map.get('remote')).toBe(2);
        expect(object.get('value')).toBe(3);
        expect(set.has('remote')).toBe(true);

        duplex.updateUpstream('upstream');
        expect(last(socket.sent)).toMatchObject({
            type: RemoteProtocol.UPDATE_DUPLEX_DATASOURCE,
            id: 'duplex',
            token: 'source-token',
            value: 'upstream'
        });

        cancellationToken.cancel();
        expect(socket.sent.slice(-6).map((message) => message.type)).toEqual([
            RemoteProtocol.CANCEL_DATASOURCE,
            RemoteProtocol.CANCEL_DUPLEX_DATASOURCE,
            RemoteProtocol.CANCEL_ARRAY_DATASOURCE,
            RemoteProtocol.CANCEL_MAP_DATASOURCE,
            RemoteProtocol.CANCEL_OBJECT_DATASOURCE,
            RemoteProtocol.CANCEL_SET_DATASOURCE
        ]);
    });

    it('shares identical subscriptions until the final consumer cancels and reports server errors', async () => {
        const { client, socket } = await connect();
        const firstToken = new CancellationToken();
        const secondToken = new CancellationToken();
        const first = createRemoteDataSource(client, 'shared', { cancellationToken: firstToken, token: 'same' }, 0);
        const second = createRemoteDataSource(client, 'shared', { cancellationToken: secondToken, token: 'same' }, 0);
        const states: string[] = [];
        const errors: Array<{ id?: string; code?: number; message: string }> = [];
        client.subscriptionState.subscribe((state) => states.push(`${state.state}:${state.id}`));
        client.errors.subscribe((error) => errors.push(error));

        expect(socket.sent.filter((message) => message.type === RemoteProtocol.LISTEN_DATASOURCE)).toHaveLength(1);
        socket.receive(
            createRemoteMessage(RemoteProtocol.SUBSCRIPTION_ACK, {
                id: 'shared',
                subscriptionType: RemoteProtocol.LISTEN_DATASOURCE
            })
        );
        socket.receive(createRemoteMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: 'shared', value: 2 }));
        expect([first.value, second.value]).toEqual([2, 2]);
        expect(states).toEqual(['subscribed:shared']);

        firstToken.cancel();
        expect(last(socket.sent).type).toBe(RemoteProtocol.LISTEN_DATASOURCE);
        secondToken.cancel();
        expect(last(socket.sent).type).toBe(RemoteProtocol.CANCEL_DATASOURCE);

        const rejectedToken = new CancellationToken();
        createRemoteDataSource(client, 'forbidden', { cancellationToken: rejectedToken });
        socket.receive(
            createRemoteMessage(RemoteProtocol.LISTEN_DATASOURCE_ERR, {
                id: 'forbidden',
                errorCode: 401,
                error: 'Unauthorized'
            })
        );
        expect(errors).toEqual([{ type: RemoteProtocol.LISTEN_DATASOURCE_ERR, id: 'forbidden', code: 401, message: 'Unauthorized' }]);
        rejectedToken.cancel();
    });

    it('detects array revision gaps once and accepts the replacement snapshot', async () => {
        const { client, socket } = await connect();
        const cancellationToken = new CancellationToken();
        const array = createRemoteArrayDataSource(client, 'items', { cancellationToken }, []);
        const states: string[] = [];
        client.subscriptionState.subscribe((state) => states.push(`${state.state}:${state.revision ?? '-'}`));

        socket.receive(
            createRemoteMessage(RemoteProtocol.UPDATE_ARRAY_DATASOURCE, {
                id: 'items',
                revision: 0,
                snapshot: true,
                change: { operationDetailed: 'merge', items: [1] }
            })
        );
        socket.receive(
            createRemoteMessage(RemoteProtocol.UPDATE_ARRAY_DATASOURCE, {
                id: 'items',
                revision: 1,
                snapshot: false,
                change: { operationDetailed: 'append', items: [2] }
            })
        );
        expect(array.getData()).toEqual([1, 2]);

        const sentBeforeGap = socket.sent.length;
        const gap = createRemoteMessage(RemoteProtocol.UPDATE_ARRAY_DATASOURCE, {
            id: 'items',
            revision: 3,
            snapshot: false,
            change: { operationDetailed: 'append', items: [99] }
        });
        socket.receive(gap);
        socket.receive(gap);
        expect(states).toEqual(['resynchronizing:-']);
        expect(socket.sent.slice(sentBeforeGap).map((message) => message.type)).toEqual([
            RemoteProtocol.CANCEL_ARRAY_DATASOURCE,
            RemoteProtocol.LISTEN_ARRAY_DATASOURCE
        ]);

        socket.receive(
            createRemoteMessage(RemoteProtocol.UPDATE_ARRAY_DATASOURCE, {
                id: 'items',
                revision: 4,
                snapshot: true,
                change: { operationDetailed: 'merge', items: [1, 2, 3] }
            })
        );
        socket.receive(
            createRemoteMessage(RemoteProtocol.SUBSCRIPTION_ACK, {
                id: 'items',
                subscriptionType: RemoteProtocol.LISTEN_ARRAY_DATASOURCE
            })
        );
        expect(array.getData()).toEqual([1, 2, 3]);
        expect(states).toEqual(['resynchronizing:-', 'subscribed:4']);
        cancellationToken.cancel();
    });

    it('reports and closes an unacknowledged subscription', async () => {
        vi.useFakeTimers();
        const { client, socket } = await connect({ subscriptionAckTimeoutMs: 20 });
        const cancellationToken = new CancellationToken();
        const errors: string[] = [];
        client.errors.subscribe((error) => errors.push(error.message));
        createRemoteDataSource(client, 'unacknowledged', { cancellationToken });

        await vi.advanceTimersByTimeAsync(20);
        expect(errors).toEqual(['Subscription unacknowledged was not acknowledged within 20ms']);
        expect(socket.closes).toEqual([{ code: 4001, reason: 'subscription acknowledgement timeout' }]);
        cancellationToken.cancel();
    });

    it('rejects pending RPCs on disconnect, reconnects, and resubscribes', async () => {
        vi.useFakeTimers();
        const { client, socket } = await connect({ reconnect: true, reconnectMinDelayMs: 10, reconnectMaxDelayMs: 20 });
        const cancellationToken = new CancellationToken();
        createRemoteDataSource(client, 'value', { cancellationToken });
        const pendingRPC = client.call('pending', undefined, { timeoutMs: 1_000 });
        const pendingRPCExpectation = expect(pendingRPC).rejects.toThrow('Connection closed before RPC completed');

        socket.serverClose();
        await pendingRPCExpectation;
        expect(client.isConnected).toBe(false);
        await vi.advanceTimersByTimeAsync(10);

        const replacement = last(TestWebSocket.instances);
        expect(replacement).not.toBe(socket);
        replacement.open();
        replacement.receive(createRemoteMessage(RemoteProtocol.HELLO_ACK));
        await vi.runAllTicks();
        expect(client.isConnected).toBe(true);
        expect(replacement.sent.map((message) => message.type)).toEqual([
            RemoteProtocol.HELLO,
            RemoteProtocol.LISTEN_DATASOURCE
        ]);
        cancellationToken.cancel();
    });

    it('fails cleanly when the handshake errors or times out', async () => {
        vi.useFakeTimers();
        const failed = RemoteClient.connect({
            url: 'ws://failure.invalid',
            webSocketFactory: TestWebSocket,
            reconnect: false,
            connectTimeoutMs: 25
        });
        const failedExpectation = expect(failed).rejects.toThrow(/Failed to connect|closed before handshake/);
        last(TestWebSocket.instances).fail();
        await failedExpectation;

        const timedOut = RemoteClient.connect({
            url: 'ws://timeout.invalid',
            webSocketFactory: TestWebSocket,
            reconnect: false,
            connectTimeoutMs: 25
        });
        const timeoutSocket = last(TestWebSocket.instances);
        const timedOutExpectation = expect(timedOut).rejects.toThrow(/timed out during handshake|closed before handshake/);
        await vi.advanceTimersByTimeAsync(25);
        await timedOutExpectation;
        expect(timeoutSocket.closes[0]).toEqual({ code: 4000, reason: 'handshake timeout' });
    });
});
