import {
    ReadOnlyArrayDataSource,
    DuplexDataSource,
    ReadOnlyDataSource,
} from "aurumjs";

export interface Endpoint<S, T = "read"> {
    source: S;
    authenticator(token: string, operation: T): boolean;
}

export class Router {
    private exposedDataSources: Map<
        string,
        {
            source: ReadOnlyDataSource<any>;
            authenticator(token: string, operation: "read"): boolean;
        }
    >;

    private exposedDuplexDataSources: Map<
        string,
        {
            source: DuplexDataSource<any>;
            authenticator(token: string, operation: "read" | "write"): boolean;
        }
    >;
    private exposedReadOnlyArrayDataSources: Map<
        string,
        {
            source: ReadOnlyArrayDataSource<any>;
            authenticator(token: string, operation: "read"): boolean;
        }
    >;

    constructor() {
        this.exposedDataSources = new Map();
        this.exposedDuplexDataSources = new Map();
        this.exposedReadOnlyArrayDataSources = new Map();
    }

    public getExposedDataSource(id: string): Endpoint<ReadOnlyDataSource<any>> {
        return this.exposedDataSources.get(id);
    }

    public getExposedArrayDataSource(
        id: string
    ): Endpoint<ReadOnlyArrayDataSource<any>> {
        return this.exposedReadOnlyArrayDataSources.get(id);
    }

    public getExposedDuplexDataSource(
        id: string
    ): Endpoint<DuplexDataSource<any>, "read" | "write"> {
        return this.exposedDuplexDataSources.get(id);
    }

    public exposeDataSource<I>(
        id: string,
        source: ReadOnlyDataSource<I>,
        authenticate: (token: string, operation: "read") => boolean = () => true
    ): void {
        this.exposedDataSources.set(id, {
            authenticator: authenticate,
            source,
        });
    }

    public exposeArrayDataSource<I>(
        id: string,
        source: ReadOnlyArrayDataSource<I>,
        authenticate?: (token: string, operation: "read") => boolean
    ): void {
        this.exposedReadOnlyArrayDataSources.set(id, {
            authenticator: authenticate,
            source,
        });
    }

    public exposeDuplexDataSource<I>(
        id: string,
        source: DuplexDataSource<I>,
        authenticate?: (token: string, operation: "read" | "write") => boolean
    ): void {
        this.exposedDuplexDataSources.set(id, {
            authenticator: authenticate,
            source,
        });
    }
}
