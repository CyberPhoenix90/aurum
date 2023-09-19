import { ArrayDataSource, CollectionChange, DataSource, MapDataSource, SetDataSource } from '../stream/data_source.js';
import { DuplexDataSource } from '../stream/duplex_data_source.js';
import { ObjectDataSource } from '../stream/object_data_source.js';
import { CancellationToken } from '../utilities/cancellation_token.js';

export enum RemoteProtocol {
    HEARTBEAT,
    LISTEN_DATASOURCE,
    LISTEN_DATASOURCE_ERR,
    UPDATE_DATASOURCE,
    UPDATE_DATASOURCE_ERR,
    CANCEL_DATASOURCE,

    PERFORM_RPC,
    PERFORM_RPC_ERR,
    PERFORM_RPC_RESULT,
    PERFORM_RPC_RESULT_ERR,

    LISTEN_DUPLEX_DATASOURCE_ERR,
    LISTEN_DUPLEX_DATASOURCE,
    UPDATE_DUPLEX_DATASOURCE,
    UPDATE_DUPLEX_DATASOURCE_ERR,
    CANCEL_DUPLEX_DATASOURCE,

    LISTEN_ARRAY_DATASOURCE,
    LISTEN_ARRAY_DATASOURCE_ERR,
    UPDATE_ARRAY_DATASOURCE,
    UPDATE_ARRAY_DATASOURCE_ERR,
    CANCEL_ARRAY_DATASOURCE,

    LISTEN_MAP_DATASOURCE,
    LISTEN_MAP_DATASOURCE_ERR,
    UPDATE_MAP_DATASOURCE,
    UPDATE_MAP_DATASOURCE_ERR,
    CANCEL_MAP_DATASOURCE,

    LISTEN_OBJECT_DATASOURCE,
    LISTEN_OBJECT_DATASOURCE_ERR,
    UPDATE_OBJECT_DATASOURCE,
    UPDATE_OBJECT_DATASOURCE_ERR,
    CANCEL_OBJECT_DATASOURCE,

    LISTEN_SET_DATASOURCE,
    LISTEN_SET_DATASOURCE_ERR,
    UPDATE_SET_DATASOURCE,
    UPDATE_SET_DATASOURCE_ERR,
    CANCEL_SET_DATASOURCE
}

export interface AurumServerInfo {
    protocol?: 'wss' | 'ws';
    host?: string;
    id: string;
    authenticationToken?: string;
}

const pendingRPCResponses: Map<string, { resolve(value: any); reject(error: any) }> = new Map();

export function getRemoteFunction<I, O = void>(aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): (input: I) => Promise<O> {
    return syncFunction(aurumServerInfo, cancellation);
}

function syncFunction(aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): (input: any) => Promise<any> {
    const key = makeKey(aurumServerInfo.protocol, aurumServerInfo.host);

    return async (input) => {
        await ensureConnection(key, aurumServerInfo.protocol, aurumServerInfo.host);
        return new Promise<any>((resolve, reject) => {
            const client = connections.get(key);
            if (!client) {
                throw new Error('Client not connected');
            }
            return client.performRPC(input, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation).then(resolve, reject);
        });
    };
}

export async function syncSetDataSource(source: SetDataSource<any>, aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): Promise<void> {
    const key = makeKey(aurumServerInfo.protocol, aurumServerInfo.host);
    await ensureConnection(key, aurumServerInfo.protocol, aurumServerInfo.host);
    connections.get(key).syncSetDataSource(source, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation);
}

export async function syncObjectDataSource(source: ObjectDataSource<any>, aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): Promise<void> {
    const key = makeKey(aurumServerInfo.protocol, aurumServerInfo.host);
    await ensureConnection(key, aurumServerInfo.protocol, aurumServerInfo.host);
    connections.get(key).syncObjectDataSource(source, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation);
}

export async function syncMapDataSource(source: MapDataSource<any, any>, aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): Promise<void> {
    const key = makeKey(aurumServerInfo.protocol, aurumServerInfo.host);
    await ensureConnection(key, aurumServerInfo.protocol, aurumServerInfo.host);
    connections.get(key).syncMapDataSource(source, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation);
}

export async function syncDataSource(source: DataSource<any>, aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): Promise<void> {
    const key = makeKey(aurumServerInfo.protocol, aurumServerInfo.host);
    await ensureConnection(key, aurumServerInfo.protocol, aurumServerInfo.host);
    connections.get(key).syncDataSource(source, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation);
}

function makeKey(protocol: 'wss' | 'ws', host: string): string {
    return `${resolveProtocol(protocol)}://${resolveHost(host)}`;
}

export async function syncArrayDataSource(source: ArrayDataSource<any>, aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): Promise<void> {
    const key = makeKey(aurumServerInfo.protocol, aurumServerInfo.host);
    await ensureConnection(key, aurumServerInfo.protocol, aurumServerInfo.host);
    connections.get(key).syncArrayDataSource(source, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation);
}

export async function syncDuplexDataSource(source: DuplexDataSource<any>, aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): Promise<void> {
    const key = makeKey(aurumServerInfo.protocol, aurumServerInfo.host);
    await ensureConnection(key, aurumServerInfo.protocol, aurumServerInfo.host);
    connections.get(key).syncDuplexDataSource(source, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation);
}

const connections: Map<string, AurumServerClient> = new Map();
const pendingConnections = new Map<string, Promise<AurumServerClient>>();

class AurumServerClient {
    private masterToken: CancellationToken;
    private readonly connection: WebSocket;
    private synchedDataSources: Map<string, Map<string, { source: DataSource<any>; listeners: { source: DataSource<any>; token: CancellationToken }[] }>>;
    private synchedDuplexDataSources: Map<
        string,
        Map<string, { source: DuplexDataSource<any>; listeners: { source: DuplexDataSource<any>; token: CancellationToken }[] }>
    >;
    private synchedArrayDataSources: Map<
        string,
        Map<string, { source: ArrayDataSource<any>; listeners: { source: ArrayDataSource<any>; token: CancellationToken }[] }>
    >;
    private synchedMapDataSources: Map<
        string,
        Map<string, { source: MapDataSource<any, any>; listeners: { source: MapDataSource<any, any>; token: CancellationToken }[] }>
    >;
    private synchedObjectDataSources: Map<
        string,
        Map<string, { source: ObjectDataSource<any>; listeners: { source: ObjectDataSource<any>; token: CancellationToken }[] }>
    >;
    private synchedSetDataSources: Map<
        string,
        Map<string, { source: SetDataSource<any>; listeners: { source: SetDataSource<any>; token: CancellationToken }[] }>
    >;

    private constructor(connection: WebSocket) {
        this.masterToken = new CancellationToken();
        this.connection = connection;
        this.synchedDataSources = new Map();
        this.synchedDuplexDataSources = new Map();
        this.synchedArrayDataSources = new Map();
        this.synchedMapDataSources = new Map();
        this.synchedObjectDataSources = new Map();
        this.synchedSetDataSources = new Map();
    }

    public syncDataSource(source: DataSource<any>, id: string, authenticationToken: string, cancellation: CancellationToken): void {
        this.syncSource(
            cancellation,
            id,
            authenticationToken,
            source,
            this.synchedDataSources,
            RemoteProtocol.LISTEN_DATASOURCE,
            RemoteProtocol.CANCEL_DATASOURCE
        );
    }

    public syncObjectDataSource(source: ObjectDataSource<any>, id: string, authenticationToken: string, cancellation: CancellationToken): void {
        this.syncSource(
            cancellation,
            id,
            authenticationToken,
            source,
            this.synchedObjectDataSources,
            RemoteProtocol.LISTEN_OBJECT_DATASOURCE,
            RemoteProtocol.CANCEL_OBJECT_DATASOURCE
        );
    }

    public performRPC(input, endpointId: string, authenticationToken: string, cancellation: CancellationToken): Promise<any> {
        return new Promise((resolve, reject) => {
            const uuid = Math.random().toString();
            pendingRPCResponses.set(uuid, { resolve, reject });

            this.connection.send(
                JSON.stringify({
                    type: RemoteProtocol.PERFORM_RPC,
                    token: authenticationToken,
                    id: endpointId,
                    value: input,
                    uuid
                })
            );
        });
    }

    public syncSetDataSource(source: SetDataSource<any>, id: string, authenticationToken: string, cancellation: CancellationToken): void {
        this.syncSource(
            cancellation,
            id,
            authenticationToken,
            source,
            this.synchedSetDataSources,
            RemoteProtocol.LISTEN_SET_DATASOURCE,
            RemoteProtocol.CANCEL_SET_DATASOURCE
        );
    }

    public syncMapDataSource(source: MapDataSource<any, any>, id: string, authenticationToken: string, cancellation: CancellationToken): void {
        this.syncSource(
            cancellation,
            id,
            authenticationToken,
            source,
            this.synchedMapDataSources,
            RemoteProtocol.LISTEN_MAP_DATASOURCE,
            RemoteProtocol.CANCEL_MAP_DATASOURCE
        );
    }

    public syncArrayDataSource(source: ArrayDataSource<any>, id: string, authenticationToken: string, cancellation: CancellationToken): void {
        this.syncSource(
            cancellation,
            id,
            authenticationToken,
            source,
            this.synchedArrayDataSources,
            RemoteProtocol.LISTEN_ARRAY_DATASOURCE,
            RemoteProtocol.CANCEL_ARRAY_DATASOURCE
        );
    }

    public syncDuplexDataSource(source: DuplexDataSource<any>, id: string, authenticationToken: string, cancellation: CancellationToken): void {
        this.syncSource(
            cancellation,
            id,
            authenticationToken,
            source,
            this.synchedDuplexDataSources,
            RemoteProtocol.LISTEN_DUPLEX_DATASOURCE,
            RemoteProtocol.CANCEL_DUPLEX_DATASOURCE
        );

        source.listenUpstream((v) => {
            this.connection.send(
                JSON.stringify({
                    type: RemoteProtocol.UPDATE_DUPLEX_DATASOURCE,
                    token: authenticationToken,
                    value: v,
                    id
                })
            );
        }, CancellationToken.fromMultiple([cancellation, this.masterToken]));
    }

    private syncSource(
        cancellation: CancellationToken,
        id: string,
        authenticationToken: string,
        source: any,
        syncedSources: Map<string, Map<string, { source: any; listeners: { source: any; token: CancellationToken }[] }>>,
        listenMessage: RemoteProtocol,
        cancelMessage: RemoteProtocol
    ) {
        cancellation.addCancellable(() => {
            const listenersByAuth = syncedSources.get(id);
            const listeners = listenersByAuth.get(authenticationToken);
            listeners.listeners.splice(listeners.listeners.findIndex((s) => s.source === source));
            if (listeners.listeners.length === 0) {
                listenersByAuth.delete(authenticationToken);
                listeners.source.cancelAll();
                this.connection.send(
                    JSON.stringify({
                        type: cancelMessage,
                        id,
                        token: authenticationToken
                    })
                );
            }
        });

        if (!syncedSources.has(id)) {
            syncedSources.set(id, new Map());
        }
        if (!syncedSources.get(id).has(authenticationToken)) {
            this.connection.send(
                JSON.stringify({
                    type: listenMessage,
                    id,
                    token: authenticationToken
                })
            );
            syncedSources.get(id).set(authenticationToken, { source, listeners: [] });
        }
        syncedSources.get(id).get(authenticationToken).listeners.push({
            source,
            token: cancellation
        });
    }

    public static connect(host: string, protocol?: 'ws' | 'wss'): Promise<AurumServerClient> {
        let pendingToken = new CancellationToken();
        let started = false;
        let latency = [0, 0, 0, 0, 0];
        let cycle = 0;
        let latencyTs;
        let lastBeat;
        return new Promise((resolve, reject) => {
            protocol = resolveProtocol(protocol);
            host = resolveHost(host);
            const connection = new WebSocket(`${protocol}://${host}`);
            const client = new AurumServerClient(connection);
            client.masterToken.addCancellable(() => {
                connections.delete(makeKey(protocol, host));
            });

            pendingToken.setTimeout(() => {
                connection.close(4001, 'no response');
                reject();
                client.masterToken.cancel();
            }, 5000);

            connection.addEventListener('message', (m) => {
                lastBeat = Date.now();
                try {
                    const msg = JSON.parse(m.data);
                    switch (msg.type) {
                        case RemoteProtocol.HEARTBEAT:
                            latency[cycle] = Date.now() - latencyTs;
                            if ((cycle + 1) % latency.length === 0) {
                                console.log(`AurumServer latency: ${(latency.reduce((p, c) => p + c) / latency.length).toFixed(1)}ms`);
                                cycle = 0;
                            } else {
                                cycle++;
                            }
                            break;
                        case RemoteProtocol.PERFORM_RPC_RESULT_ERR:
                        case RemoteProtocol.PERFORM_RPC_ERR:
                            pendingRPCResponses.get(msg.uuid).reject(new Error(msg.error));
                            pendingRPCResponses.delete(msg.uuid);
                            break;
                        case RemoteProtocol.PERFORM_RPC_RESULT:
                            pendingRPCResponses.get(msg.uuid).resolve(msg.result);
                            pendingRPCResponses.delete(msg.uuid);
                            break;
                        case RemoteProtocol.UPDATE_DATASOURCE:
                            if (client.synchedDataSources.has(msg.id)) {
                                const byAuth = client.synchedDataSources.get(msg.id);
                                for (const dss of byAuth.values()) {
                                    dss.source.update(msg.value);
                                }
                            }
                            break;
                        case RemoteProtocol.UPDATE_ARRAY_DATASOURCE:
                            if (client.synchedArrayDataSources.has(msg.id)) {
                                const byAuth = client.synchedArrayDataSources.get(msg.id);
                                for (const dss of byAuth.values()) {
                                    const change: CollectionChange<any> = msg.change;
                                    dss.source.applyCollectionChange(change);
                                }
                            }
                            break;
                        case RemoteProtocol.UPDATE_DUPLEX_DATASOURCE:
                            if (client.synchedDuplexDataSources.has(msg.id)) {
                                const byAuth = client.synchedDuplexDataSources.get(msg.id);
                                for (const dss of byAuth.values()) {
                                    dss.source.updateDownstream(msg.value);
                                }
                            }
                            break;
                        case RemoteProtocol.UPDATE_MAP_DATASOURCE:
                            if (client.synchedMapDataSources.has(msg.id)) {
                                const byAuth = client.synchedMapDataSources.get(msg.id);
                                for (const dss of byAuth.values()) {
                                    dss.source.applyMapChange(msg.change);
                                }
                            }
                            break;
                    }
                } catch (e) {
                    console.warn('Recieved malformed message from server');
                    console.warn(e);
                }
            });
            connection.addEventListener('error', (e) => {
                client.masterToken.cancel();
                reject(e);
            });
            connection.addEventListener('open', () => {
                pendingToken.cancel();
                pendingToken = undefined;
                started = true;
                lastBeat = Date.now();
                client.masterToken.setInterval(() => {
                    if (Date.now() - lastBeat > 10000) {
                        connection.close(4000, 'timeout');
                        return;
                    }
                    latencyTs = Date.now();
                    connection.send(
                        JSON.stringify({
                            type: RemoteProtocol.HEARTBEAT
                        })
                    );
                }, 2500);

                resolve(client);
            });
            connection.addEventListener('close', () => {
                client.masterToken.cancel();
                if (started) {
                    ensureConnection(makeKey(protocol, host), protocol, host).then((newClient) => {
                        newClient.migrate(client);
                    });
                } else {
                    reject();
                }
            });
        });
    }

    private migrate(client: AurumServerClient) {
        for (const id of client.synchedDataSources.keys()) {
            for (const auth of client.synchedDataSources.get(id).keys()) {
                for (const { source, token } of client.synchedDataSources.get(id).get(auth).listeners) {
                    this.syncDataSource(source, id, auth, token);
                }
            }
        }
        for (const id of client.synchedArrayDataSources.keys()) {
            for (const auth of client.synchedArrayDataSources.get(id).keys()) {
                for (const { source, token } of client.synchedArrayDataSources.get(id).get(auth).listeners) {
                    this.syncArrayDataSource(source, id, auth, token);
                }
            }
        }
        for (const id of client.synchedDuplexDataSources.keys()) {
            for (const auth of client.synchedDuplexDataSources.get(id).keys()) {
                for (const { source, token } of client.synchedDuplexDataSources.get(id).get(auth).listeners) {
                    this.syncDuplexDataSource(source, id, auth, token);
                }
            }
        }
        for (const id of client.synchedMapDataSources.keys()) {
            for (const auth of client.synchedMapDataSources.get(id).keys()) {
                for (const { source, token } of client.synchedMapDataSources.get(id).get(auth).listeners) {
                    this.syncMapDataSource(source, id, auth, token);
                }
            }
        }
        for (const id of client.synchedObjectDataSources.keys()) {
            for (const auth of client.synchedObjectDataSources.get(id).keys()) {
                for (const { source, token } of client.synchedObjectDataSources.get(id).get(auth).listeners) {
                    this.syncObjectDataSource(source, id, auth, token);
                }
            }
        }
        for (const id of client.synchedSetDataSources.keys()) {
            for (const auth of client.synchedSetDataSources.get(id).keys()) {
                for (const { source, token } of client.synchedSetDataSources.get(id).get(auth).listeners) {
                    this.syncSetDataSource(source, id, auth, token);
                }
            }
        }

        this.synchedDataSources = new Map();
        this.synchedDuplexDataSources = new Map();
        this.synchedArrayDataSources = new Map();
        this.synchedMapDataSources = new Map();
        this.synchedObjectDataSources = new Map();
        this.synchedSetDataSources = new Map();
    }
}

function resolveProtocol(protocol: 'ws' | 'wss'): 'ws' | 'wss' {
    if (!protocol) {
        if (typeof location === 'undefined') {
            throw new Error('Protocol is not optional in non browser environments');
        }
        if (location.protocol.startsWith('https')) {
            protocol = 'wss';
        } else {
            protocol = 'ws';
        }
    }
    return protocol;
}

function resolveHost(host: string): string {
    if (!host) {
        if (typeof location === 'undefined') {
            throw new Error('Host is not optional in non browser environments');
        }
        return location.host;
    }
    return host;
}

async function ensureConnection(key: string, protocol: 'ws' | 'wss', host: string): Promise<AurumServerClient> {
    if (connections.has(key)) {
        return connections.get(key);
    }

    let backoff = 1000;
    if (pendingConnections.has(key)) {
        return pendingConnections.get(key);
    } else {
        const pendingConnection = new Promise<AurumServerClient>((resolve) => {
            async function tryConnect() {
                const p = AurumServerClient.connect(host, protocol);
                try {
                    const client = await p;
                    connections.set(key, client);
                    pendingConnections.delete(key);
                    resolve(client);
                    backoff = 1000;
                } catch (e) {
                    setTimeout(() => {
                        backoff += 1000;
                        tryConnect();
                    }, backoff);
                }
            }
            tryConnect();
        });
        pendingConnections.set(key, pendingConnection);
        return pendingConnection;
    }
}
