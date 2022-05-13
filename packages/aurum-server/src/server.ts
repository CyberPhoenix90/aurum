import {
    ArrayDataSource,
    CancellationToken,
    CollectionChange,
    DataSource,
    DuplexDataSource,
    MapChange,
    MapDataSource,
    ObjectChange,
    ObjectDataSource,
    RemoteProtocol,
    SetDataSource
} from 'aurumjs';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import * as ws from 'ws';
import { Client } from './client';
import { Endpoint, ExposeConfig, Router } from './router';

export interface AurumServerConfig {
    reuseServer?: HttpServer | HttpsServer;
    port?: number;
    maxMessageSize?: number;
    onClientConnected?: (client: Client) => void;
    onClientDisconnected?: (client: Client) => void;
    onError?: (client: Client, error: string) => void;
}

export class AurumServer {
    private wsServer: ws.Server;
    private wsServerClients: Client[];
    private config: AurumServerConfig;

    private routers: { [key: string]: Router };

    private constructor(config: AurumServerConfig) {
        this.config = config;

        this.routers = {
            ['']: new Router()
        };
    }

    public getClients(): ReadonlyArray<Client> {
        return this.wsServerClients;
    }

    public exposeRouter(route: string, router: Router): void {
        this.routers[route] = router;
        router.attach(this.getClients());
    }

    public removeRouter(route: string): void {
        delete this.routers[route];
    }

    public static create(config?: AurumServerConfig): AurumServer {
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
            const client = new Client(ws);
            server.wsServerClients.push(client);

            ws.on('message', (data) => {
                server.processMessage(client, data);
            });

            ws.on('close', () => {
                server.wsServerClients.splice(server.wsServerClients.indexOf(client), 1);
                client.dispose();
                config.onClientDisconnected?.(client);
            });
            config.onClientConnected?.(client);
        });

        return server;
    }

    private processMessage(sender: Client, data: ws.Data): void {
        if (typeof data === 'string') {
            if (data.length >= this.config.maxMessageSize) {
                this.config.onError?.(sender, `Received message with size ${data.length} max allowed is ${this.config.maxMessageSize}`);
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
                    case RemoteProtocol.UPDATE_DATASOURCE:
                        this.updateDataSource(message, sender);
                        break;
                    case RemoteProtocol.UPDATE_ARRAY_DATASOURCE:
                        this.updateArrayDataSource(message, sender);
                        break;
                    case RemoteProtocol.UPDATE_DUPLEX_DATASOURCE:
                        this.updateDuplexDataSource(message, sender);
                        break;
                    case RemoteProtocol.UPDATE_MAP_DATASOURCE:
                        this.updateMapDataSource(message, sender);
                        break;
                    case RemoteProtocol.UPDATE_SET_DATASOURCE:
                        this.updateSetDataSource(message, sender);
                        break;
                    case RemoteProtocol.UPDATE_OBJECT_DATASOURCE:
                        this.updateObjectDataSource(message, sender);
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

    private listenDataSource(message: any, sender: Client) {
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

    public getExposedDataSource(id: string): Endpoint<DataSource<any>> {
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

    public getExposedArrayDataSource(id: string): Endpoint<ArrayDataSource<any>> {
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

    public getExposedObjectDataSource(id: string): Endpoint<ObjectDataSource<any>> {
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

    public getExposedSetDataSource(id: string): Endpoint<SetDataSource<any>> {
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

    private listenArrayDataSource(message: any, sender: Client) {
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
                    // Optimize network traffic by removing fields not used by the client
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

    private listenMapDataSource(message: any, sender: Client): void {
        const id = message.id;
        if (sender.mapdsSubscriptions.has(id)) {
            return;
        }
        const endpoint = this.getExposedMapDataSource(id);
        if (endpoint) {
            const token = new CancellationToken();
            if (endpoint.authenticator(message.token, 'read')) {
                sender.mapdsSubscriptions.set(id, token);
                endpoint.source.listen((change) => {
                    change = Object.assign({}, change);
                    // Optimize network traffic by removing fields not used by the client
                    delete change.oldValue;
                    sender.sendMessage(RemoteProtocol.UPDATE_MAP_DATASOURCE, {
                        id,
                        change
                    });
                }, token);
                for (const key in endpoint.source.keys()) {
                    sender.sendMessage(RemoteProtocol.UPDATE_MAP_DATASOURCE, {
                        id,
                        change: {
                            key,
                            newValue: endpoint.source.get(key),
                            oldValue: undefined
                        } as MapChange<any, any>
                    });
                }
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

    private listenObjectDataSource(message: any, sender: Client): void {
        const id = message.id;
        if (sender.odsSubscriptions.has(id)) {
            return;
        }
        const endpoint = this.getExposedObjectDataSource(id);
        if (endpoint) {
            const token = new CancellationToken();
            if (endpoint.authenticator(message.token, 'read')) {
                sender.odsSubscriptions.set(id, token);
                endpoint.source.listen((change) => {
                    change = Object.assign({}, change);
                    // Optimize network traffic by removing fields not used by the client
                    delete change.oldValue;
                    sender.sendMessage(RemoteProtocol.UPDATE_OBJECT_DATASOURCE, {
                        id,
                        change
                    });
                }, token);
                for (const key in endpoint.source.keys()) {
                    sender.sendMessage(RemoteProtocol.UPDATE_OBJECT_DATASOURCE, {
                        id,
                        change: {
                            key,
                            newValue: endpoint.source.get(key),
                            oldValue: undefined
                        } as ObjectChange<any, any>
                    });
                }
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

    private listenDuplexDataSource(message: any, sender: Client) {
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

    private updateDuplexDataSource(message: any, sender: Client) {
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

    private cancelSubscriptionToExposedSource(message: any, sender: Client) {
        const sub = sender.dsSubscriptions.get(message.url);
        if (sub) {
            sub.cancel();
            sender.dsSubscriptions.delete(message.url);
        }
    }

    private cancelSubscriptionToExposedArraySource(message: any, sender: Client) {
        const sub = sender.adsSubscriptions.get(message.url);
        if (sub) {
            sub.cancel();
            sender.adsSubscriptions.delete(message.url);
        }
    }

    private cancelSubscriptionToExposedDuplexSource(message: any, sender: Client) {
        const sub = sender.ddsSubscriptions.get(message.url);
        if (sub) {
            sub.cancel();
            sender.ddsSubscriptions.delete(message.url);
        }
    }

    private cancelSubscriptionToExposedMapDataSource(message: any, sender: Client) {
        const sub = sender.mapdsSubscriptions.get(message.url);
        if (sub) {
            sub.cancel();
            sender.mapdsSubscriptions.delete(message.url);
        }
    }

    private cancelSubscriptionToExposedObjectDataSource(message: any, sender: Client) {
        const sub = sender.odsSubscriptions.get(message.url);
        if (sub) {
            sub.cancel();
            sender.odsSubscriptions.delete(message.url);
        }
    }

    private cancelSubscriptionToExposedSetDataSource(message: any, sender: Client) {
        const sub = sender.setdsSubscriptions.get(message.url);
        if (sub) {
            sub.cancel();
            sender.setdsSubscriptions.delete(message.url);
        }
    }

    public exposeSetDataSource<I>(id: string, source: SetDataSource<I>, config: ExposeConfig): void {
        this.routers[''].exposeSetDataSource(id, source, config);
    }

    public exposeObjectDataSource<I>(id: string, source: ObjectDataSource<I>, config: ExposeConfig): void {
        this.routers[''].exposeObjectDataSource(id, source, config);
    }

    public exposeDataSource<I>(id: string, source: DataSource<I>, config?: ExposeConfig): void {
        this.routers[''].exposeDataSource(id, source, config);
    }

    public exposeMapDataSource<K, V>(id: string, source: MapDataSource<K, V>, config?: ExposeConfig): void {
        this.routers[''].exposeMapDataSource(id, source, config);
    }

    public exposeArrayDataSource<I>(id: string, source: ArrayDataSource<I>, config?: ExposeConfig): void {
        this.routers[''].exposeArrayDataSource(id, source, config);
    }

    public exposeDuplexDataSource<I>(id: string, source: DuplexDataSource<I>, config?: ExposeConfig): void {
        this.routers[''].exposeDuplexDataSource(id, source, config);
    }
}
