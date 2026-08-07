import {
    CancellationToken,
    DuplexDataSource,
    MapDataSource,
    ReadOnlyArrayDataSource,
    ReadOnlyDataSource,
    ReadOnlyObjectDataSource,
    ReadOnlySetDataSource
} from '@aurum/streams';
import { Client } from './client.js';
import { Session } from './session.js';

export type EndpointOperation = 'read' | 'write';

export interface Endpoint<S, T = EndpointOperation> {
    source: S;
    authenticator(token: string | undefined, operation: T): boolean | Promise<boolean>;
}

export interface ExposeConfig {
    authenticate?: (token: string | undefined, operation: EndpointOperation) => boolean | Promise<boolean>;
    cancellationToken?: CancellationToken;
}

export interface ExposeFunctionConfig {
    authenticate?: (token: string | undefined) => boolean | Promise<boolean>;
    /** @deprecated Use `authenticate` for consistency with source endpoints. */
    authenticator?: (token: string | undefined) => boolean | Promise<boolean>;
    cancellationToken?: CancellationToken;
}

export interface RPCEndpoint<I, O> {
    func: (input: I, session: Session<any>, cancellationToken: CancellationToken) => O | Promise<O>;
    authenticator(token: string | undefined): boolean | Promise<boolean>;
}

type SourceEndpoint<S> = Endpoint<S, EndpointOperation>;

export class Router {
    private readonly exposedFunctions = new Map<string, RPCEndpoint<any, any>>();
    private readonly exposedObjectDataSources = new Map<string, SourceEndpoint<ReadOnlyObjectDataSource<any>>>();
    private readonly exposedDataSources = new Map<string, SourceEndpoint<ReadOnlyDataSource<any>>>();
    private readonly exposedDuplexDataSources = new Map<string, SourceEndpoint<DuplexDataSource<any>>>();
    private readonly exposedArrayDataSources = new Map<string, SourceEndpoint<ReadOnlyArrayDataSource<any>>>();
    private readonly exposedMapDataSources = new Map<string, SourceEndpoint<MapDataSource<any, any>>>();
    private readonly exposedSetDataSources = new Map<string, SourceEndpoint<ReadOnlySetDataSource<any>>>();
    private clients: readonly Client<any>[] = [];
    private route = '';

    public attach(clients: readonly Client<any>[], route = ''): void {
        this.clients = clients;
        this.route = route;
    }

    public getExposedFunction(id: string): RPCEndpoint<any, any> | undefined {
        return this.exposedFunctions.get(id);
    }

    public getExposedObjectDataSource(id: string): Endpoint<ReadOnlyObjectDataSource<any>> | undefined {
        return this.exposedObjectDataSources.get(id);
    }

    public getExposedSetDataSource(id: string): Endpoint<ReadOnlySetDataSource<any>> | undefined {
        return this.exposedSetDataSources.get(id);
    }

    public getExposedDataSource(id: string): Endpoint<ReadOnlyDataSource<any>> | undefined {
        return this.exposedDataSources.get(id);
    }

    public getExposedArrayDataSource(id: string): Endpoint<ReadOnlyArrayDataSource<any>> | undefined {
        return this.exposedArrayDataSources.get(id);
    }

    public getExposedMapDataSource(id: string): Endpoint<MapDataSource<any, any>> | undefined {
        return this.exposedMapDataSources.get(id);
    }

    public getExposedDuplexDataSource(id: string): Endpoint<DuplexDataSource<any>> | undefined {
        return this.exposedDuplexDataSources.get(id);
    }

    public exposeSetDataSource<I>(id: string, source: ReadOnlySetDataSource<I>, config: ExposeConfig = {}): void {
        this.expose(id, source, this.exposedSetDataSources, config, (client) => client.setdsSubscriptions);
    }

    public exposeObjectDataSource<I extends object>(id: string, source: ReadOnlyObjectDataSource<I>, config: ExposeConfig = {}): void {
        this.expose(id, source, this.exposedObjectDataSources, config, (client) => client.odsSubscriptions);
    }

    public exposeDataSource<I>(id: string, source: ReadOnlyDataSource<I>, config: ExposeConfig = {}): void {
        this.expose(id, source, this.exposedDataSources, config, (client) => client.dsSubscriptions);
    }

    public exposeMapDataSource<K, V>(id: string, source: MapDataSource<K, V>, config: ExposeConfig = {}): void {
        this.expose(id, source, this.exposedMapDataSources, config, (client) => client.mapdsSubscriptions);
    }

    public exposeArrayDataSource<I>(id: string, source: ReadOnlyArrayDataSource<I>, config: ExposeConfig = {}): void {
        this.expose(id, source, this.exposedArrayDataSources, config, (client) => client.adsSubscriptions);
    }

    public exposeDuplexDataSource<I>(id: string, source: DuplexDataSource<I>, config: ExposeConfig = {}): void {
        this.expose(id, source, this.exposedDuplexDataSources, config, (client) => client.ddsSubscriptions);
    }

    public exposeFunction<I, O>(
        id: string,
        func: (input: I, session: Session<any>, cancellationToken: CancellationToken) => O | Promise<O>,
        config: ExposeFunctionConfig = {}
    ): void {
        assertAvailable(this.exposedFunctions, id);
        const endpoint: RPCEndpoint<I, O> = {
            func,
            authenticator: config.authenticate ?? config.authenticator ?? (() => true)
        };
        this.exposedFunctions.set(id, endpoint);
        config.cancellationToken?.addCancellable(() => {
            if (this.exposedFunctions.get(id) === endpoint) {
                this.exposedFunctions.delete(id);
            }
        });
    }

    public clear(): void {
        this.cancelSubscriptions(this.exposedDataSources, (client) => client.dsSubscriptions);
        this.cancelSubscriptions(this.exposedDuplexDataSources, (client) => client.ddsSubscriptions);
        this.cancelSubscriptions(this.exposedArrayDataSources, (client) => client.adsSubscriptions);
        this.cancelSubscriptions(this.exposedMapDataSources, (client) => client.mapdsSubscriptions);
        this.cancelSubscriptions(this.exposedSetDataSources, (client) => client.setdsSubscriptions);
        this.cancelSubscriptions(this.exposedObjectDataSources, (client) => client.odsSubscriptions);
        this.exposedFunctions.clear();
    }

    private expose<S>(
        id: string,
        source: S,
        sources: Map<string, SourceEndpoint<S>>,
        config: ExposeConfig,
        subscriptionSelector: (client: Client<any>) => Map<string, CancellationToken>
    ): void {
        assertAvailable(sources, id);
        const endpoint: SourceEndpoint<S> = {
            authenticator: config.authenticate ?? ((_token, operation) => operation === 'read'),
            source
        };
        sources.set(id, endpoint);
        config.cancellationToken?.addCancellable(() => {
            if (sources.get(id) !== endpoint) {
                return;
            }
            for (const client of this.clients) {
                const subscriptions = subscriptionSelector(client);
                const remoteId = this.route + id;
                subscriptions.get(remoteId)?.cancel();
                subscriptions.delete(remoteId);
            }
            sources.delete(id);
        });
    }

    private cancelSubscriptions<S>(
        sources: Map<string, SourceEndpoint<S>>,
        subscriptionSelector: (client: Client<any>) => Map<string, CancellationToken>
    ): void {
        for (const client of this.clients) {
            const subscriptions = subscriptionSelector(client);
            for (const id of sources.keys()) {
                const remoteId = this.route + id;
                subscriptions.get(remoteId)?.cancel();
                subscriptions.delete(remoteId);
            }
        }
        sources.clear();
    }
}

function assertAvailable(map: Map<string, unknown>, id: string): void {
    if (!id) {
        throw new Error('Endpoint id cannot be empty');
    }
    if (map.has(id)) {
        throw new Error(`Endpoint ${id} is already exposed`);
    }
}
