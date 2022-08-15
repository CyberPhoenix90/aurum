import {
    ArrayDataSource,
    CancellationToken,
    DataSource,
    DuplexDataSource,
    MapDataSource,
    ObjectDataSource,
    ReadOnlyArrayDataSource,
    ReadOnlyDataSource,
    ReadOnlyObjectDataSource,
    ReadOnlySetDataSource,
    SetDataSource
} from 'aurumjs';
import { Client } from './client';
import { Session } from './session';

export interface Endpoint<S, T = 'read' | 'write'> {
    source: S;
    authenticator(token: string, operation: T): boolean;
}

export interface ExposeConfig {
    authenticate?: (token: string, operation: 'read' | 'write') => boolean;
    cancellationToken?: CancellationToken;
}

export interface RPCEndpoint<I, O> {
    func: (input: I, session?: Session<any>) => O;
    authenticator(token: string): boolean;
}

export class Router {
    private exposedFunctions = new Map<
        string,
        {
            func: (input: any, session: Session<any>) => any;
            authenticator(token: string): boolean;
        }
    >();
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

    private clients: readonly Client<any>[];

    constructor() {
        this.exposedDataSources = new Map();
        this.exposedDuplexDataSources = new Map();
        this.exposedArrayDataSources = new Map();
        this.exposedMapDataSources = new Map();
        this.exposedSetDataSources = new Map();
        this.exposedObjectDataSources = new Map();
    }

    public attach(clients: readonly Client<any>[]): void {
        this.clients = clients;
    }

    public getExposedFunction(id: string): RPCEndpoint<any, any> {
        return this.exposedFunctions.get(id);
    }

    public getExposedObjectDataSource(id: string): Endpoint<ReadOnlyObjectDataSource<any>> {
        return this.exposedObjectDataSources.get(id);
    }

    public getExposedSetDataSource(id: string): Endpoint<ReadOnlySetDataSource<any>> {
        return this.exposedSetDataSources.get(id);
    }

    public getExposedDataSource(id: string): Endpoint<ReadOnlyDataSource<any>> {
        return this.exposedDataSources.get(id);
    }

    public getExposedArrayDataSource(id: string): Endpoint<ReadOnlyArrayDataSource<any>> {
        return this.exposedArrayDataSources.get(id);
    }

    public getExposedMapDataSource(id: string): Endpoint<MapDataSource<any, any>> {
        return this.exposedMapDataSources.get(id);
    }

    public getExposedDuplexDataSource(id: string): Endpoint<DuplexDataSource<any>, 'read' | 'write'> {
        return this.exposedDuplexDataSources.get(id);
    }

    public exposeSetDataSource<I>(id: string, source: ReadOnlySetDataSource<I>, config: ExposeConfig = {}): void {
        this.expose(id, source, this.exposedSetDataSources, config, (c) => c.setdsSubscriptions);
    }

    public exposeObjectDataSource<I>(id: string, source: ReadOnlyObjectDataSource<I>, config: ExposeConfig = {}): void {
        this.expose(id, source, this.exposedObjectDataSources, config, (c) => c.odsSubscriptions);
    }

    public exposeDataSource<I>(id: string, source: ReadOnlyDataSource<I>, config: ExposeConfig = {}): void {
        this.expose(id, source, this.exposedDataSources, config, (c) => c.dsSubscriptions);
    }

    public exposeFunction<I, O>(
        id: string,
        func: (input: I, session: Session<any>) => O,
        config: {
            cancellationToken?: CancellationToken;
            authenticator?(token: string): boolean;
        } = {}
    ): void {
        this.exposedFunctions.set(id, {
            func,
            authenticator: config.authenticator ?? (() => true)
        });

        if (config.cancellationToken) {
            config.cancellationToken.addCancelable(() => {
                this.exposedFunctions.delete(id);
            });
        }
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
        subscritionSelector: (client: Client<any>) => Map<string, CancellationToken>
    ): void {
        sources.set(id, {
            //Default is read only public
            authenticator: config?.authenticate ?? ((token, op) => op === 'read'),
            source
        });

        if (config?.cancellationToken) {
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

    public exposeMapDataSource<K, V>(id: string, source: MapDataSource<K, V>, config: ExposeConfig = {}): void {
        this.expose(id, source, this.exposedMapDataSources, config, (c) => c.mapdsSubscriptions);
    }

    public exposeArrayDataSource<I>(id: string, source: ReadOnlyArrayDataSource<I>, config: ExposeConfig = {}): void {
        this.expose(id, source, this.exposedArrayDataSources, config, (c) => c.adsSubscriptions);
    }

    public exposeDuplexDataSource<I>(id: string, source: DuplexDataSource<I>, config: ExposeConfig = {}): void {
        this.expose(id, source, this.exposedDuplexDataSources, config, (c) => c.ddsSubscriptions);
    }

    public clear(): void {
        for (const s of this.exposedDataSources.values()) {
            s.source.cancelAll();
        }
        for (const s of this.exposedDuplexDataSources.values()) {
            s.source.cancelAll();
        }

        for (const s of this.exposedArrayDataSources.values()) {
            s.source.cancelAll();
        }

        for (const s of this.exposedMapDataSources.values()) {
            s.source.cancelAll();
        }

        for (const s of this.exposedSetDataSources.values()) {
            s.source.cancelAll();
        }

        for (const s of this.exposedObjectDataSources.values()) {
            s.source.cancelAll();
        }
    }
}
