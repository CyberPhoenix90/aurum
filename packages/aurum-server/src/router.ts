import { ArrayDataSource, CancellationToken, DataSource, DuplexDataSource, MapDataSource, ObjectDataSource, SetDataSource } from 'aurumjs';
import { Client } from './client';

export interface Endpoint<S, T = 'read' | 'write'> {
    source: S;
    authenticator(token: string, operation: T): boolean;
}

export interface ExposeConfig {
    authenticate?: (token: string, operation: 'read' | 'write') => boolean;
    cancellationToken?: CancellationToken;
}

export class Router {
    private exposedObjectDataSources: Map<
        string,
        {
            source: ObjectDataSource<any>;
            authenticator(token: string, operation: 'read' | 'write'): boolean;
        }
    >;
    private exposedDataSources: Map<
        string,
        {
            source: DataSource<any>;
            authenticator(token: string, operation: 'read'): boolean;
        }
    >;

    private exposedDuplexDataSources: Map<
        string,
        {
            source: DuplexDataSource<any>;
            authenticator(token: string, operation: 'read' | 'write'): boolean;
        }
    >;
    private exposedArrayDataSources: Map<
        string,
        {
            source: ArrayDataSource<any>;
            authenticator(token: string, operation: 'read' | 'write'): boolean;
        }
    >;
    private exposedMapDataSources: Map<
        string,
        {
            source: MapDataSource<any, any>;
            authenticator(token: string, operation: 'read' | 'write'): boolean;
        }
    >;
    private exposedSetDataSources: Map<
        string,
        {
            source: SetDataSource<any>;
            authenticator(token: string, operation: 'read' | 'write'): boolean;
        }
    >;

    private clients: readonly Client[];

    constructor() {
        this.exposedDataSources = new Map();
        this.exposedDuplexDataSources = new Map();
        this.exposedArrayDataSources = new Map();
    }

    public attach(clients: readonly Client[]): void {
        this.clients = clients;
    }

    public getExposedObjectDataSource(id: string): Endpoint<ObjectDataSource<any>> {
        return this.exposedObjectDataSources.get(id);
    }

    public getExposedSetDataSource(id: string): Endpoint<SetDataSource<any>> {
        return this.exposedSetDataSources.get(id);
    }

    public getExposedDataSource(id: string): Endpoint<DataSource<any>> {
        return this.exposedDataSources.get(id);
    }

    public getExposedArrayDataSource(id: string): Endpoint<ArrayDataSource<any>> {
        return this.exposedArrayDataSources.get(id);
    }

    public getExposedMapDataSource(id: string): Endpoint<MapDataSource<any, any>> {
        return this.exposedMapDataSources.get(id);
    }

    public getExposedDuplexDataSource(id: string): Endpoint<DuplexDataSource<any>, 'read' | 'write'> {
        return this.exposedDuplexDataSources.get(id);
    }

    public exposeSetDataSource<I>(id: string, source: SetDataSource<I>, config: ExposeConfig): void {
        this.expose(id, source, this.exposedSetDataSources, config, (c) => c.setdsSubscriptions);
    }

    public exposeObjectDataSource<I>(id: string, source: ObjectDataSource<I>, config: ExposeConfig): void {
        this.expose(id, source, this.exposedObjectDataSources, config, (c) => c.odsSubscriptions);
    }

    public exposeDataSource<I>(id: string, source: DataSource<I>, config: ExposeConfig): void {
        this.expose(id, source, this.exposedDataSources, config, (c) => c.dsSubscriptions);
    }

    private expose(
        id: string,
        source: any,
        sources: Map<
            string,
            {
                source: any;
                authenticator(token: string, operation: 'read' | 'write'): boolean;
            }
        >,
        config: ExposeConfig,
        subscritionSelector: (client: Client) => Map<string, CancellationToken>
    ): void {
        sources.set(id, {
            //Default is read only public
            authenticator: config.authenticate ?? ((token, op) => op === 'read'),
            source
        });

        if (config.cancellationToken) {
            config.cancellationToken.addCancelable(() => {
                this.clients?.forEach((c) => {
                    const subs = subscritionSelector(c);
                    if (subs.has(id)) {
                        subs.get(id).cancel();
                    }
                });
                sources.delete(id);
            });
        }
    }

    public exposeMapDataSource<K, V>(id: string, source: MapDataSource<K, V>, config: ExposeConfig): void {
        this.expose(id, source, this.exposedMapDataSources, config, (c) => c.mapdsSubscriptions);
    }

    public exposeArrayDataSource<I>(id: string, source: ArrayDataSource<I>, config: ExposeConfig): void {
        this.expose(id, source, this.exposedArrayDataSources, config, (c) => c.adsSubscriptions);
    }

    public exposeDuplexDataSource<I>(id: string, source: DuplexDataSource<I>, config: ExposeConfig): void {
        this.expose(id, source, this.exposedDuplexDataSources, config, (c) => c.ddsSubscriptions);
    }
}
