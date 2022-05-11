import { ReadOnlyArrayDataSource, DuplexDataSource, ReadOnlyDataSource, MapDataSource, CancellationToken } from 'aurumjs';
import { Client } from './client';

export interface Endpoint<S, T = 'read'> {
    source: S;
    authenticator(token: string, operation: T): boolean;
}

export class Router {
    private exposedDataSources: Map<
        string,
        {
            source: ReadOnlyDataSource<any>;
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
    private exposedReadOnlyArrayDataSources: Map<
        string,
        {
            source: ReadOnlyArrayDataSource<any>;
            authenticator(token: string, operation: 'read'): boolean;
        }
    >;
    private exposedMapDataSources: Map<
        string,
        {
            source: MapDataSource<any, any>;
            authenticator(token: string, operation: 'read'): boolean;
        }
    >;
    private clients: readonly Client[];

    constructor() {
        this.exposedDataSources = new Map();
        this.exposedDuplexDataSources = new Map();
        this.exposedReadOnlyArrayDataSources = new Map();
    }

    public attach(clients: readonly Client[]): void {
        this.clients = clients;
    }

    public getExposedDataSource(id: string): Endpoint<ReadOnlyDataSource<any>> {
        return this.exposedDataSources.get(id);
    }

    public getExposedArrayDataSource(id: string): Endpoint<ReadOnlyArrayDataSource<any>> {
        return this.exposedReadOnlyArrayDataSources.get(id);
    }

    public getExposedMapDataSource(id: string): Endpoint<MapDataSource<any, any>> {
        return this.exposedMapDataSources.get(id);
    }

    public getExposedDuplexDataSource(id: string): Endpoint<DuplexDataSource<any>, 'read' | 'write'> {
        return this.exposedDuplexDataSources.get(id);
    }

    public exposeDataSource<I>(
        id: string,
        source: ReadOnlyDataSource<I>,
        authenticate: (token: string, operation: 'read') => boolean = () => true,
        cancellationToken?: CancellationToken
    ): void {
        this.exposedDataSources.set(id, {
            authenticator: authenticate,
            source
        });

        if (cancellationToken) {
            cancellationToken.addCancelable(() => {
                this.clients?.forEach((c) => {
                    if (c.dsSubscriptions.has(id)) {
                        c.dsSubscriptions.get(id).cancel();
                    }
                });
                this.exposedDataSources.delete(id);
            });
        }
    }

    public exposeMapDataSource<K, V>(
        id: string,
        source: MapDataSource<K, V>,
        authenticate: (token: string, operation: 'read') => boolean = () => true,
        cancellationToken?: CancellationToken
    ): void {
        this.exposedMapDataSources.set(id, {
            authenticator: authenticate,
            source
        });

        if (cancellationToken) {
            cancellationToken.addCancelable(() => {
                this.clients?.forEach((c) => {
                    if (c.mapdsSubscriptions.has(id)) {
                        c.mapdsSubscriptions.get(id).cancel();
                    }
                });
                this.exposedDataSources.delete(id);
            });
        }
    }

    public exposeArrayDataSource<I>(
        id: string,
        source: ReadOnlyArrayDataSource<I>,
        authenticate?: (token: string, operation: 'read') => boolean,
        cancellationToken?: CancellationToken
    ): void {
        this.exposedReadOnlyArrayDataSources.set(id, {
            authenticator: authenticate,
            source
        });

        if (cancellationToken) {
            cancellationToken.addCancelable(() => {
                this.clients?.forEach((c) => {
                    if (c.adsSubscriptions.has(id)) {
                        c.adsSubscriptions.get(id).cancel();
                    }
                });
                this.exposedDataSources.delete(id);
            });
        }
    }

    public exposeDuplexDataSource<I>(
        id: string,
        source: DuplexDataSource<I>,
        authenticate?: (token: string, operation: 'read' | 'write') => boolean,
        cancellationToken?: CancellationToken
    ): void {
        this.exposedDuplexDataSources.set(id, {
            authenticator: authenticate,
            source
        });

        if (cancellationToken) {
            cancellationToken.addCancelable(() => {
                this.clients?.forEach((c) => {
                    if (c.ddsSubscriptions.has(id)) {
                        c.ddsSubscriptions.get(id).cancel();
                    }
                });
                this.exposedDataSources.delete(id);
            });
        }
    }
}
