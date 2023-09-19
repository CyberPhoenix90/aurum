import {
    CancellationToken,
    CollectionChange,
    DuplexDataSource,
    MapDataSource,
    ReadOnlyArrayDataSource,
    ReadOnlyDataSource,
    ReadOnlyObjectDataSource,
    ReadOnlySetDataSource,
    RemoteProtocol
} from 'aurumjs';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import ws from 'ws';
import { Client } from './client.js';
import { Endpoint, ExposeConfig, Router, RPCEndpoint } from './router.js';
import { Session } from './session.js';

export interface AurumServerConfig<T> {
    reuseServer?: HttpServer | HttpsServer;
    port?: number;
    maxMessageSize?: number;
    onClientConnected?: (session: Session<T>) => void;
    onClientDisconnected?: (session: Session<T>) => void;
    onError?: (session: Session<T>, error: string) => void;
}

export class AurumServer<T = void> {
    private wsServer: ws.Server;
    private wsServerClients: Client<T>[];
    private config: AurumServerConfig<T>;

    private routers: { [key: string]: Router };

    private constructor(config: AurumServerConfig<T>) {
        this.config = config;

        this.routers = {
            ['']: new Router()
        };
    }

    public getSessions(): ReadonlyArray<Session<T>> {
        return this.wsServerClients.map((client) => client.session);
    }

    public exposeRouter(route: string, router: Router, cancellationToken?: CancellationToken): void {
        this.routers[route] = router;
        router.attach(this.wsServerClients);

        cancellationToken?.addCancellable(() => {
            this.removeRouter(route);
        });
    }

    public removeRouter(route: string): void {
        const router = this.routers[route];
        if (router) {
            delete this.routers[route];
            router.clear();
        }
    }

    public static create<T>(config?: AurumServerConfig<T>): AurumServer<T> {
        const server = new AurumServer({
            onClientConnected: config.onClientConnected,
            onClientDisconnected: config.onClientDisconnected,
            reuseServer: config.reuseServer,
            maxMessageSize: config?.maxMessageSize || 1048576,
            port: config?.port ?? 8080
        });

        server.wsServer = new ws.Server({
            server: config.reuseServer,
            port: config.port
        });

        server.wsServerClients = [];

        server.wsServer.on('connection', (ws: ws) => {
            const client = new Client<T>(ws);
            const session = new Session<T>(client, client.connectionToken);
            client.session = session;
            server.wsServerClients.push(client);

            ws.on('message', (data) => {
                server.processMessage(client, data);
            });

            ws.on('close', () => {
                server.wsServerClients.splice(server.wsServerClients.indexOf(client), 1);
                client.dispose();
                config.onClientDisconnected?.(client.session);
            });
            config.onClientConnected?.(client.session);
        });

        return server;
    }

    private processMessage(sender: Client<T>, data: ws.Data): void {
        if (typeof data === 'string') {
            if (data.length >= this.config.maxMessageSize) {
                this.config.onError?.(sender.session, `Received message with size ${data.length} max allowed is ${this.config.maxMessageSize}`);
                return;
            }

            try {
                const message = JSON.parse(data);
                const type: RemoteProtocol = message.type;
                sender.timeSinceLastMessage = Date.now();
                switch (type) {
                    case RemoteProtocol.CANCEL_DATASOURCE:
                        this.cancelSubscriptionToExposedSource(message, sender);
                        break;
                    case RemoteProtocol.CANCEL_ARRAY_DATASOURCE:
                        this.cancelSubscriptionToExposedArraySource(message, sender);
                        break;
                    case RemoteProtocol.CANCEL_DUPLEX_DATASOURCE:
                        this.cancelSubscriptionToExposedDuplexSource(message, sender);
                        break;
                    case RemoteProtocol.CANCEL_MAP_DATASOURCE:
                        this.cancelSubscriptionToExposedMapDataSource(message, sender);
                        break;
                    case RemoteProtocol.CANCEL_SET_DATASOURCE:
                        this.cancelSubscriptionToExposedSetDataSource(message, sender);
                        break;
                    case RemoteProtocol.CANCEL_OBJECT_DATASOURCE:
                        this.cancelSubscriptionToExposedObjectDataSource(message, sender);
                        break;
                    case RemoteProtocol.LISTEN_DATASOURCE:
                        this.listenDataSource(message, sender);
                        break;
                    case RemoteProtocol.LISTEN_DUPLEX_DATASOURCE:
                        this.listenDuplexDataSource(message, sender);
                        break;
                    case RemoteProtocol.LISTEN_ARRAY_DATASOURCE:
                        this.listenArrayDataSource(message, sender);
                        break;
                    case RemoteProtocol.LISTEN_MAP_DATASOURCE:
                        this.listenMapDataSource(message, sender);
                        break;
                    case RemoteProtocol.LISTEN_OBJECT_DATASOURCE:
                        this.listenObjectDataSource(message, sender);
                        break;
                    case RemoteProtocol.LISTEN_SET_DATASOURCE:
                        this.listenSetDataSource(message, sender);
                        break;
                    case RemoteProtocol.UPDATE_DUPLEX_DATASOURCE:
                        this.updateDuplexDataSource(message, sender);
                        break;
                    case RemoteProtocol.UPDATE_DUPLEX_DATASOURCE:
                        this.updateDuplexDataSource(message, sender);
                        break;
                    case RemoteProtocol.UPDATE_MAP_DATASOURCE:
                        this.updateMapDataSource(message, sender);
                        break;
                    case RemoteProtocol.PERFORM_RPC:
                        this.performRPC(message, sender);
                        break;
                    case RemoteProtocol.HEARTBEAT:
                        sender.sendMessage(RemoteProtocol.HEARTBEAT, undefined);
                        break;
                }
            } catch (e) {
                console.error('Failed to parse message');
                console.error(e);
            }
        }
    }
    private performRPC(message: any, sender: Client<T>) {
        const id = message.id;
        const uuid = message.uuid;

        const funcEndpoint = this.getExposedFunction(id);
        if (!funcEndpoint) {
            sender.sendMessage(RemoteProtocol.PERFORM_RPC_ERR, {
                id,
                uuid,
                errorCode: 404,
                error: `Function ${id} not found`
            });
            return;
        } else {
            if (funcEndpoint.authenticator(message.token)) {
                try {
                    const result = funcEndpoint.func(message.value, sender.session);
                    if (result instanceof Promise) {
                        result
                            .then((res) => {
                                sender.sendMessage(RemoteProtocol.PERFORM_RPC_RESULT, {
                                    id,
                                    uuid,
                                    result: res
                                });
                            })
                            .catch((err) => {
                                sender.sendMessage(RemoteProtocol.PERFORM_RPC_ERR, {
                                    id,
                                    uuid,
                                    errorCode: 500,
                                    error: err.message
                                });
                            });
                    } else {
                        sender.sendMessage(RemoteProtocol.PERFORM_RPC_RESULT, {
                            id,
                            uuid,
                            result
                        });
                    }
                } catch (e) {
                    sender.sendMessage(RemoteProtocol.PERFORM_RPC_RESULT_ERR, {
                        id,
                        uuid,
                        errorCode: 500,
                        error: e.message
                    });
                }
            } else {
                sender.sendMessage(RemoteProtocol.PERFORM_RPC_ERR, {
                    id,
                    uuid,
                    errorCode: 401,
                    error: `Unauthorized to call ${id}`
                });
                return;
            }
        }
    }

    private listenDataSource(message: any, sender: Client<T>) {
        const id = message.id;
        if (sender.dsSubscriptions.has(id)) {
            return;
        }
        const endpoint = this.getExposedDataSource(id);
        if (endpoint) {
            const token = new CancellationToken();

            if (endpoint.authenticator(message.token, 'read')) {
                sender.dsSubscriptions.set(id, token);
                endpoint.source.listenAndRepeat((value) => {
                    sender.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, {
                        id,
                        value
                    });
                }, token);
            } else {
                sender.sendMessage(RemoteProtocol.LISTEN_DATASOURCE_ERR, {
                    id,
                    errorCode: 401,
                    error: 'Unauthorized'
                });
            }
        } else {
            sender.sendMessage(RemoteProtocol.LISTEN_DATASOURCE_ERR, {
                id,
                errorCode: 404,
                error: 'No such datasource'
            });
        }
    }

    public getExposedFunction(id: string): RPCEndpoint<any, any> {
        for (const routerPath in this.routers) {
            if (routerPath !== '' && id.startsWith(routerPath)) {
                const result = this.routers[routerPath].getExposedFunction(id.substring(routerPath.length));
                if (result) {
                    return result;
                }
            }
        }

        return this.routers[''].getExposedFunction(id);
    }

    public getExposedDataSource(id: string): Endpoint<ReadOnlyDataSource<any>> {
        for (const routerPath in this.routers) {
            if (routerPath !== '' && id.startsWith(routerPath)) {
                const result = this.routers[routerPath].getExposedDataSource(id.substring(routerPath.length));
                if (result) {
                    return result;
                }
            }
        }

        return this.routers[''].getExposedDataSource(id);
    }

    public getExposedArrayDataSource(id: string): Endpoint<ReadOnlyArrayDataSource<any>> {
        for (const routerPath in this.routers) {
            if (routerPath !== '' && id.startsWith(routerPath)) {
                const result = this.routers[routerPath].getExposedArrayDataSource(id.substring(routerPath.length));
                if (result) {
                    return result;
                }
            }
        }

        return this.routers[''].getExposedArrayDataSource(id);
    }

    public getExposedMapDataSource(id: string): Endpoint<MapDataSource<any, any>> {
        for (const routerPath in this.routers) {
            if (routerPath !== '' && id.startsWith(routerPath)) {
                const result = this.routers[routerPath].getExposedMapDataSource(id.substring(routerPath.length));
                if (result) {
                    return result;
                }
            }
        }

        return this.routers[''].getExposedMapDataSource(id);
    }

    public getExposedObjectDataSource(id: string): Endpoint<ReadOnlyObjectDataSource<any>> {
        for (const routerPath in this.routers) {
            if (routerPath !== '' && id.startsWith(routerPath)) {
                const result = this.routers[routerPath].getExposedObjectDataSource(id.substring(routerPath.length));
                if (result) {
                    return result;
                }
            }
        }

        return this.routers[''].getExposedObjectDataSource(id);
    }

    public getExposedSetDataSource(id: string): Endpoint<ReadOnlySetDataSource<any>> {
        for (const routerPath in this.routers) {
            if (routerPath !== '' && id.startsWith(routerPath)) {
                const result = this.routers[routerPath].getExposedSetDataSource(id.substring(routerPath.length));
                if (result) {
                    return result;
                }
            }
        }

        return this.routers[''].getExposedSetDataSource(id);
    }

    public getExposedDuplexDataSource(id: string): Endpoint<DuplexDataSource<any>, 'read' | 'write'> {
        for (const routerPath in this.routers) {
            if (routerPath !== '' && id.startsWith(routerPath)) {
                const result = this.routers[routerPath].getExposedDuplexDataSource(id.substring(routerPath.length));
                if (result) {
                    return result;
                }
            }
        }

        return this.routers[''].getExposedDuplexDataSource(id);
    }

    private listenArrayDataSource(message: any, sender: Client<T>) {
        const id = message.id;
        if (sender.adsSubscriptions.has(id)) {
            return;
        }
        const endpoint = this.getExposedArrayDataSource(id);
        if (endpoint) {
            const token = new CancellationToken();
            if (endpoint.authenticator(message.token, 'read')) {
                sender.adsSubscriptions.set(id, token);
                endpoint.source.listen((change) => {
                    change = Object.assign({}, change);
                    // Optimize network traffic by removing fields not used by the Client<T>
                    delete change.operation;
                    delete change.previousState;
                    delete change.newState;
                    sender.sendMessage(RemoteProtocol.UPDATE_ARRAY_DATASOURCE, {
                        id,
                        change
                    });
                }, token);
                sender.sendMessage(RemoteProtocol.UPDATE_ARRAY_DATASOURCE, {
                    id,
                    change: {
                        operationDetailed: 'merge',
                        items: endpoint.source.getData()
                    } as CollectionChange<any>
                });
            } else {
                sender.sendMessage(RemoteProtocol.LISTEN_ARRAY_DATASOURCE_ERR, {
                    id,
                    errorCode: 401,
                    error: 'Unauthorized'
                });
            }
        } else {
            sender.sendMessage(RemoteProtocol.LISTEN_ARRAY_DATASOURCE_ERR, {
                id,
                errorCode: 404,
                error: 'No such array datasource'
            });
        }
    }

    private listenMapDataSource(message: any, sender: Client<T>): void {
        const id = message.id;
        if (sender.mapdsSubscriptions.has(id)) {
            return;
        }
        const endpoint = this.getExposedMapDataSource(id);
        if (endpoint) {
            const token = new CancellationToken();
            if (endpoint.authenticator(message.token, 'read')) {
                sender.mapdsSubscriptions.set(id, token);
                endpoint.source.listenAndRepeat((change) => {
                    change = Object.assign({}, change);
                    // Optimize network traffic by removing fields not used by the Client<T>
                    delete change.oldValue;
                    sender.sendMessage(RemoteProtocol.UPDATE_MAP_DATASOURCE, {
                        id,
                        change
                    });
                }, token);
            } else {
                sender.sendMessage(RemoteProtocol.LISTEN_MAP_DATASOURCE_ERR, {
                    id,
                    errorCode: 401,
                    error: 'Unauthorized'
                });
            }
        } else {
            sender.sendMessage(RemoteProtocol.LISTEN_MAP_DATASOURCE_ERR, {
                id,
                errorCode: 404,
                error: 'No such map datasource'
            });
        }
    }

    private listenObjectDataSource(message: any, sender: Client<T>): void {
        const id = message.id;
        if (sender.odsSubscriptions.has(id)) {
            return;
        }
        const endpoint = this.getExposedObjectDataSource(id);
        if (endpoint) {
            const token = new CancellationToken();
            if (endpoint.authenticator(message.token, 'read')) {
                sender.odsSubscriptions.set(id, token);
                endpoint.source.listenAndRepeat((change) => {
                    change = Object.assign({}, change);
                    // Optimize network traffic by removing fields not used by the Client<T>
                    delete change.oldValue;
                    sender.sendMessage(RemoteProtocol.UPDATE_OBJECT_DATASOURCE, {
                        id,
                        change
                    });
                }, token);
            } else {
                sender.sendMessage(RemoteProtocol.LISTEN_OBJECT_DATASOURCE_ERR, {
                    id,
                    errorCode: 401,
                    error: 'Unauthorized'
                });
            }
        } else {
            sender.sendMessage(RemoteProtocol.LISTEN_OBJECT_DATASOURCE_ERR, {
                id,
                errorCode: 404,
                error: 'No such map datasource'
            });
        }
    }

    private listenSetDataSource(message: any, sender: Client<T>): void {
        const id = message.id;
        if (sender.setdsSubscriptions.has(id)) {
            return;
        }
        const endpoint = this.getExposedSetDataSource(id);
        if (endpoint) {
            const token = new CancellationToken();
            if (endpoint.authenticator(message.token, 'read')) {
                sender.setdsSubscriptions.set(id, token);
                endpoint.source.listenAndRepeat((change) => {
                    sender.sendMessage(RemoteProtocol.UPDATE_SET_DATASOURCE, {
                        id,
                        change
                    });
                }, token);
            } else {
                sender.sendMessage(RemoteProtocol.LISTEN_SET_DATASOURCE, {
                    id,
                    errorCode: 401,
                    error: 'Unauthorized'
                });
            }
        } else {
            sender.sendMessage(RemoteProtocol.LISTEN_SET_DATASOURCE_ERR, {
                id,
                errorCode: 404,
                error: 'No such map datasource'
            });
        }
    }

    private listenDuplexDataSource(message: any, sender: Client<T>) {
        const id = message.id;
        if (sender.ddsSubscriptions.has(id)) {
            return;
        }
        const endpoint = this.getExposedDuplexDataSource(id);
        if (endpoint) {
            const token = new CancellationToken();

            if (endpoint.authenticator(message.token, 'read')) {
                sender.ddsSubscriptions.set(id, token);
                endpoint.source.listenAndRepeat((value) => {
                    sender.sendMessage(RemoteProtocol.UPDATE_DUPLEX_DATASOURCE, {
                        id,
                        value
                    });
                }, token);
            } else {
                sender.sendMessage(RemoteProtocol.LISTEN_DUPLEX_DATASOURCE_ERR, {
                    id,
                    errorCode: 401,
                    error: 'Unauthorized'
                });
            }
        } else {
            sender.sendMessage(RemoteProtocol.LISTEN_DUPLEX_DATASOURCE_ERR, {
                id,
                errorCode: 404,
                error: 'No such duplex datasource'
            });
        }
    }

    private updateMapDataSource(message: any, sender: Client<T>) {
        const id = message.id;
        const endpoint = this.getExposedMapDataSource(id);
        if (endpoint) {
            if (endpoint.authenticator(message.token, 'write')) {
                endpoint.source.applyMapChange(message.value);
            } else {
                sender.sendMessage(RemoteProtocol.UPDATE_MAP_DATASOURCE_ERR, {
                    id,
                    errorCode: 401,
                    error: 'Unauthorized'
                });
            }
        } else {
            sender.sendMessage(RemoteProtocol.UPDATE_MAP_DATASOURCE_ERR, {
                id,
                errorCode: 404,
                error: 'No such duplex datasource'
            });
        }
    }

    private updateDuplexDataSource(message: any, sender: Client<T>) {
        const id = message.id;
        const endpoint = this.getExposedDuplexDataSource(id);
        if (endpoint) {
            if (endpoint.authenticator(message.token, 'write')) {
                endpoint.source.updateUpstream(message.value);
            } else {
                sender.sendMessage(RemoteProtocol.UPDATE_DUPLEX_DATASOURCE_ERR, {
                    id,
                    errorCode: 401,
                    error: 'Unauthorized'
                });
            }
        } else {
            sender.sendMessage(RemoteProtocol.UPDATE_DUPLEX_DATASOURCE_ERR, {
                id,
                errorCode: 404,
                error: 'No such duplex datasource'
            });
        }
    }

    private cancelSubscriptionToExposedSource(message: any, sender: Client<T>) {
        const sub = sender.dsSubscriptions.get(message.id);
        if (sub) {
            sub.cancel();
            sender.dsSubscriptions.delete(message.id);
        }
    }

    private cancelSubscriptionToExposedArraySource(message: any, sender: Client<T>) {
        const sub = sender.adsSubscriptions.get(message.id);
        if (sub) {
            sub.cancel();
            sender.adsSubscriptions.delete(message.id);
        }
    }

    private cancelSubscriptionToExposedDuplexSource(message: any, sender: Client<T>) {
        const sub = sender.ddsSubscriptions.get(message.id);
        if (sub) {
            sub.cancel();
            sender.ddsSubscriptions.delete(message.id);
        }
    }

    private cancelSubscriptionToExposedMapDataSource(message: any, sender: Client<T>) {
        const sub = sender.mapdsSubscriptions.get(message.id);
        if (sub) {
            sub.cancel();
            sender.mapdsSubscriptions.delete(message.id);
        }
    }

    private cancelSubscriptionToExposedObjectDataSource(message: any, sender: Client<T>) {
        const sub = sender.odsSubscriptions.get(message.id);
        if (sub) {
            sub.cancel();
            sender.odsSubscriptions.delete(message.id);
        }
    }

    private cancelSubscriptionToExposedSetDataSource(message: any, sender: Client<T>) {
        const sub = sender.setdsSubscriptions.get(message.id);
        if (sub) {
            sub.cancel();
            sender.setdsSubscriptions.delete(message.id);
        }
    }

    public exposeSetDataSource<I>(id: string, source: ReadOnlySetDataSource<I>, config: ExposeConfig = {}): void {
        this.routers[''].exposeSetDataSource(id, source, config);
    }

    public exposeObjectDataSource<I>(id: string, source: ReadOnlyObjectDataSource<I>, config: ExposeConfig = {}): void {
        this.routers[''].exposeObjectDataSource(id, source, config);
    }

    public exposeFunction<I, O>(id: string, func: (input: I, session: Session<T>) => O, config: ExposeConfig = {}): void {
        this.routers[''].exposeFunction(id, func, config);
    }

    public exposeDataSource<I>(id: string, source: ReadOnlyDataSource<I>, config: ExposeConfig = {}): void {
        this.routers[''].exposeDataSource(id, source, config);
    }

    public exposeMapDataSource<K, V>(id: string, source: MapDataSource<K, V>, config: ExposeConfig = {}): void {
        this.routers[''].exposeMapDataSource(id, source, config);
    }

    public exposeArrayDataSource<I>(id: string, source: ReadOnlyArrayDataSource<I>, config: ExposeConfig = {}): void {
        this.routers[''].exposeArrayDataSource(id, source, config);
    }

    public exposeDuplexDataSource<I>(id: string, source: DuplexDataSource<I>, config: ExposeConfig = {}): void {
        this.routers[''].exposeDuplexDataSource(id, source, config);
    }
}
