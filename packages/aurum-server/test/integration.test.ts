import {
    ArrayDataSource,
    CancellationToken,
    DataSource,
    DuplexDataSource,
    MapDataSource,
    ObjectDataSource,
    SetDataSource
} from '@aurum/streams';
import { RemoteClient, RemoteProtocol, WebSocketFactory, WebSocketLike, createRemoteMessage } from '@aurum/remote';
import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { AurumServer } from '../src/server.js';
import { Router } from '../src/router.js';

describe('@aurum/server integration', () => {
    const servers: AurumServer<any>[] = [];
    const clients: RemoteClient[] = [];

    afterEach(async () => {
        clients.splice(0).forEach((client) => client.close());
        await Promise.all(servers.splice(0).map((server) => server.close()));
    });

    it('synchronizes every supported source type over a real WebSocket', async () => {
        const server = await startServer();
        const scalar = new DataSource('one');
        const array = new ArrayDataSource([1]);
        const map = new MapDataSource(new Map([['one', 1]]));
        const object = new ObjectDataSource<{ value?: number }>({ value: 1 });
        const set = new SetDataSource(['one']);
        const duplex = new DuplexDataSource('downstream');
        server.exposeDataSource('scalar', scalar);
        server.exposeArrayDataSource('array', array);
        server.exposeMapDataSource('map', map);
        server.exposeObjectDataSource('object', object);
        server.exposeSetDataSource('set', set);
        server.exposeDuplexDataSource('duplex', duplex, { authenticate: () => true });

        const client = await connect(server);
        const token = new CancellationToken();
        const acknowledged = new Set<string>();
        client.subscriptionState.subscribe((state) => {
            if (state.state === 'subscribed') {
                acknowledged.add(`${state.type}:${state.id}`);
            }
        }, token);
        const localScalar = new DataSource<string>();
        const localArray = new ArrayDataSource<number>();
        const localMap = new MapDataSource<string, number>();
        const localObject = new ObjectDataSource<{ value?: number }>({ value: 0 });
        const localSet = new SetDataSource<string>();
        const localDuplex = new DuplexDataSource<string>(undefined, false);
        client.syncDataSource(localScalar, 'scalar', { cancellationToken: token });
        client.syncArrayDataSource(localArray, 'array', { cancellationToken: token });
        client.syncMapDataSource(localMap, 'map', { cancellationToken: token });
        client.syncObjectDataSource(localObject, 'object', { cancellationToken: token });
        client.syncSetDataSource(localSet, 'set', { cancellationToken: token });
        client.syncDuplexDataSource(localDuplex, 'duplex', { cancellationToken: token });

        await until(
            () =>
                localScalar.value === 'one' &&
                localArray.length.value === 1 &&
                localMap.get('one') === 1 &&
                localObject.get('value') === 1 &&
                localSet.has('one') &&
                localDuplex.value === 'downstream' &&
                acknowledged.size === 6
        );

        scalar.update('two');
        array.push(2);
        map.set('two', 2);
        object.set('value', 2);
        set.add('two');
        duplex.update('server');
        await until(() => localScalar.value === 'two' && localArray.get(1) === 2 && localMap.get('two') === 2 && localObject.get('value') === 2 && localSet.has('two') && localDuplex.value === 'server');

        object.delete('value');
        await until(() => !localObject.hasKey('value'));
        object.set('value', 3);
        await until(() => localObject.get('value') === 3);

        let upstream: string | undefined;
        duplex.listenUpstream((value) => (upstream = value));
        localDuplex.updateUpstream('client');
        await until(() => upstream === 'client');
        token.cancel();
    });

    it('enforces RPC authentication and supports cancellation and timeouts', async () => {
        const server = await startServer();
        let serverCancellations = 0;
        server.exposeFunction<{ value: number }, number>('double', ({ value }) => value * 2, {
            authenticate: (token) => token === 'secret'
        });
        server.exposeFunction('legacy-auth', () => true, { authenticator: () => false });
        server.exposeFunction<void, void>('wait', async (_input, _session, cancellation) => {
            await new Promise<void>((resolve) =>
                cancellation.addCancellable(() => {
                    serverCancellations++;
                    resolve();
                })
            );
        });
        const client = await connect(server);

        await expect(client.call('double', { value: 2 }, { token: 'wrong' })).rejects.toThrow('Unauthorized');
        await expect(client.call<{ value: number }, number>('double', { value: 2 }, { token: 'secret' })).resolves.toBe(4);
        await expect(client.call('legacy-auth', undefined)).rejects.toThrow('Unauthorized');

        const cancellation = new CancellationToken();
        const pending = client.call('wait', undefined, { cancellationToken: cancellation, timeoutMs: 1_000 });
        cancellation.cancel();
        await expect(pending).rejects.toThrow('cancelled');
        await until(() => serverCancellations === 1);
        await expect(client.call('wait', undefined, { timeoutMs: 20 })).rejects.toThrow('timed out');
        await until(() => serverCancellations === 2);
    });

    it('reconnects and resubscribes without losing source bindings', async () => {
        const server = await startServer();
        const source = new DataSource('initial');
        server.exposeDataSource('value', source);
        const client = await connect(server, { reconnectMinDelayMs: 10, reconnectMaxDelayMs: 20 });
        const local = new DataSource<string>();
        const token = new CancellationToken();
        client.syncDataSource(local, 'value', { cancellationToken: token });
        await until(() => local.value === 'initial');

        server.getSessions()[0].terminate();
        await until(() => !client.isConnected);
        await until(() => client.isConnected && server.getSessions().length === 1);
        source.update('after reconnect');
        await until(() => local.value === 'after reconnect');
        token.cancel();
    });

    it('does not mistake a suspended event loop for a dead connection', async () => {
        const server = await startServer();
        const source = new DataSource('initial');
        server.exposeDataSource('value', source);
        const client = await connect(server, { heartbeatIntervalMs: 10, heartbeatTimeoutMs: 25 });
        const local = new DataSource<string>();
        const token = new CancellationToken();
        client.syncDataSource(local, 'value', { cancellationToken: token });
        await until(() => local.value === 'initial');

        const blockedUntil = Date.now() + 80;
        while (Date.now() < blockedUntil) {
            // Simulates the browser suspending all page tasks while a tab is inactive.
        }
        await new Promise((resolve) => setTimeout(resolve, 15));
        expect(client.isConnected).toBe(true);

        client.probe();
        source.update('awake');
        await until(() => local.value === 'awake');
        token.cancel();
    });

    it('detects a missed array delta and replaces local state with a fresh snapshot', async () => {
        const server = await startServer({ batchDelayMs: 5 });
        const source = new ArrayDataSource([1]);
        server.exposeArrayDataSource('items', source);
        const client = await connect(server, {
            webSocketFactory: DroppingArrayUpdateWebSocket as unknown as WebSocketFactory
        });
        const local = new ArrayDataSource<number>();
        const token = new CancellationToken();
        let resynchronized = false;
        client.subscriptionState.subscribe((state) => {
            if (state.id === 'items' && state.state === 'resynchronizing') {
                resynchronized = true;
            }
        }, token);
        client.syncArrayDataSource(local, 'items', { cancellationToken: token });
        await until(() => local.getData().join(',') === '1');

        source.push(2);
        source.push(3);
        await until(() => resynchronized && local.getData().join(',') === '1,2,3');
        token.cancel();
    });

    it('recovers a subscription and snapshot after a half-open connection stops delivering messages', async () => {
        FreezingOnceWebSocket.freezeNextConnection = true;
        const server = await startServer();
        const source = new ArrayDataSource([1]);
        server.exposeArrayDataSource('items', source);
        const client = await connect(server, {
            webSocketFactory: FreezingOnceWebSocket as unknown as WebSocketFactory,
            heartbeatIntervalMs: 10,
            heartbeatTimeoutMs: 25,
            reconnectMinDelayMs: 10,
            reconnectMaxDelayMs: 20
        });
        const local = new ArrayDataSource<number>();
        const token = new CancellationToken();
        let acknowledgements = 0;
        client.subscriptionState.subscribe((state) => {
            if (state.id === 'items' && state.state === 'subscribed') {
                acknowledgements++;
            }
        }, token);
        client.syncArrayDataSource(local, 'items', { cancellationToken: token });
        await until(() => acknowledgements === 1 && local.getData().join(',') === '1');

        source.push(2);
        await until(() => acknowledgements >= 2 && local.getData().join(',') === '1,2');
        expect(server.getSessions()).toHaveLength(1);
        token.cancel();
    });

    it('removes routers without cancelling application-owned source listeners', async () => {
        const server = await startServer();
        const router = new Router();
        const source = new DataSource(0);
        const routeToken = new CancellationToken();
        let applicationUpdates = 0;
        source.listen(() => applicationUpdates++);
        router.exposeDataSource('value', source);
        server.exposeRouter('api', router, routeToken);
        const client = await connect(server);
        const local = new DataSource<number>();
        const clientToken = new CancellationToken();
        client.syncDataSource(local, 'api/value', { cancellationToken: clientToken });
        await until(() => local.value === 0);

        routeToken.cancel();
        source.update(1);
        expect(applicationUpdates).toBe(1);
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(local.value).toBe(0);
        clientToken.cancel();
    });

    it('rejects unauthorized connections and malformed protocol frames', async () => {
        const server = await startServer({ authenticateConnection: (request) => request.headers.authorization === 'accepted' });
        const socket = new WebSocket(url(server));
        await new Promise<void>((resolve) => socket.once('close', () => resolve()));
        expect(server.getSessions()).toHaveLength(0);

        const protocolServer = await startServer();
        const malformed = new WebSocket(url(protocolServer));
        await new Promise<void>((resolve) => malformed.once('open', () => resolve()));
        malformed.send(JSON.stringify({ type: RemoteProtocol.HELLO }));
        const closeCode = await new Promise<number>((resolve) => malformed.once('close', (code) => resolve(code)));
        expect(closeCode).toBe(1002);
    });

    it('batches source updates and enforces per-client subscription limits', async () => {
        const server = await startServer({ batchDelayMs: 5, maxSubscriptionsPerClient: 1 });
        const first = new DataSource(0);
        const second = new DataSource(0);
        server.exposeDataSource('first', first);
        server.exposeDataSource('second', second);
        const socket = await rawConnection(server);
        socket.send(JSON.stringify(createRemoteMessage(RemoteProtocol.LISTEN_DATASOURCE, { id: 'first' })));
        await nextMessage(socket);

        first.update(1);
        first.update(2);
        first.update(3);
        const batch = await nextMessage(socket);
        expect(batch.type).toBe(RemoteProtocol.BATCH);
        expect(batch.messages?.map((message: any) => message.value)).toEqual([1, 2, 3]);

        socket.send(JSON.stringify(createRemoteMessage(RemoteProtocol.LISTEN_DATASOURCE, { id: 'second' })));
        const limitError = await nextMessage(socket);
        expect(limitError.type).toBe(RemoteProtocol.LISTEN_DATASOURCE_ERR);
        expect(limitError.errorCode).toBe(429);
        socket.close();
    });

    async function startServer(config: Parameters<typeof AurumServer.start>[0] = {}): Promise<AurumServer<any>> {
        const server = await AurumServer.start({ port: 0, batchDelayMs: 0, onError: () => undefined, ...config });
        servers.push(server);
        return server;
    }

    async function connect(server: AurumServer<any>, options: Partial<Parameters<typeof RemoteClient.connect>[0]> = {}): Promise<RemoteClient> {
        const client = await RemoteClient.connect({
            url: url(server),
            webSocketFactory: WebSocket as unknown as WebSocketFactory,
            heartbeatIntervalMs: 50,
            heartbeatTimeoutMs: 500,
            ...options
        });
        clients.push(client);
        return client;
    }

    async function rawConnection(server: AurumServer<any>): Promise<WebSocket> {
        const socket = new WebSocket(url(server));
        await new Promise<void>((resolve) => socket.once('open', () => resolve()));
        socket.send(JSON.stringify(createRemoteMessage(RemoteProtocol.HELLO)));
        expect((await nextMessage(socket)).type).toBe(RemoteProtocol.HELLO_ACK);
        return socket;
    }
});

function url(server: AurumServer<any>): string {
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Expected TCP server address');
    }
    return `ws://127.0.0.1:${address.port}`;
}

async function until(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
    const started = Date.now();
    while (!predicate()) {
        if (Date.now() - started > timeoutMs) {
            throw new Error('Timed out waiting for remote state');
        }
        await new Promise((resolve) => setTimeout(resolve, 5));
    }
}

function nextMessage(socket: WebSocket): Promise<any> {
    return new Promise((resolve) =>
        socket.once('message', (data) => {
            resolve(JSON.parse(typeof data === 'string' ? data : data.toString()));
        })
    );
}

abstract class InterceptingWebSocket implements WebSocketLike {
    private readonly socket: WebSocket;
    private readonly wrappedListeners = new Map<(event: any) => void, (event: any) => void>();

    public constructor(url: string) {
        this.socket = new WebSocket(url);
    }

    public get readyState(): number {
        return this.socket.readyState;
    }

    public send(data: string): void {
        this.socket.send(data);
    }

    public close(code?: number, reason?: string): void {
        this.socket.close(code, reason);
    }

    public addEventListener(type: string, listener: (event: any) => void): void {
        if (type !== 'message') {
            this.socket.addEventListener(type as any, listener as any);
            return;
        }
        const wrapped = (event: { data: unknown }) => {
            const packet = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data));
            const transformed = this.transform(packet);
            if (transformed === undefined) {
                return;
            }
            listener({ data: JSON.stringify(transformed) });
        };
        this.wrappedListeners.set(listener, wrapped);
        this.socket.addEventListener('message', wrapped as any);
    }

    public removeEventListener(type: string, listener: (event: any) => void): void {
        const wrapped = this.wrappedListeners.get(listener) ?? listener;
        this.socket.removeEventListener(type as any, wrapped as any);
        this.wrappedListeners.delete(listener);
    }

    protected abstract transform(packet: any): any | undefined;
}

class DroppingArrayUpdateWebSocket extends InterceptingWebSocket {
    private droppedDelta = false;

    protected transform(packet: any): any | undefined {
        if (packet.type === RemoteProtocol.BATCH) {
            packet.messages = packet.messages.filter((message: any) => !this.shouldDrop(message));
            return packet.messages.length === 0 ? undefined : packet;
        }
        return this.shouldDrop(packet) ? undefined : packet;
    }

    private shouldDrop(message: any): boolean {
        if (!this.droppedDelta && message.type === RemoteProtocol.UPDATE_ARRAY_DATASOURCE && message.snapshot === false) {
            this.droppedDelta = true;
            return true;
        }
        return false;
    }
}

class FreezingOnceWebSocket extends InterceptingWebSocket {
    public static freezeNextConnection = false;
    private readonly freezes: boolean;
    private frozen = false;

    public constructor(url: string) {
        super(url);
        this.freezes = FreezingOnceWebSocket.freezeNextConnection;
        FreezingOnceWebSocket.freezeNextConnection = false;
    }

    protected transform(packet: any): any | undefined {
        if (this.frozen) {
            return undefined;
        }
        const messages = packet.type === RemoteProtocol.BATCH ? packet.messages : [packet];
        if (this.freezes && messages.some((message: any) => message.type === RemoteProtocol.SUBSCRIPTION_ACK)) {
            this.frozen = true;
        }
        return packet;
    }
}
