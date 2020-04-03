import { CancellationToken } from '../utilities/cancellation_token';
import { Callback } from '../utilities/common';
import { DataSource } from './data_source';
export declare enum DataFlow {
    UPSTREAM = 0,
    DOWNSTREAM = 1
}
export declare class DuplexDataSource<T> {
    value: T;
    private updating;
    private updateDownstreamEvent;
    private updateUpstreamEvent;
    constructor(initialValue?: T);
    static fromTwoDataSource<T>(downStream: DataSource<T>, upstream: DataSource<T>, initialValue?: T): void;
    static createOneWay<T>(direction?: DataFlow, initialValue?: T): DuplexDataSource<T>;
    updateDownstream(newValue: T): void;
    updateUpstream(newValue: T): void;
    listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    listenUpstream(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    listenDownstream(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    filter(downStreamFilter: (value: T) => boolean, upstreamFilter?: (value: T) => boolean, cancellationToken?: CancellationToken): DuplexDataSource<T>;
    pipe(targetDataSource: DuplexDataSource<T>, cancellationToken?: CancellationToken): void;
    map<D>(mapper: (value: T) => D, reverseMapper: (value: D) => T, cancellationToken?: CancellationToken): DuplexDataSource<D>;
    unique(cancellationToken?: CancellationToken): DuplexDataSource<T>;
    oneWayFlow(direction?: DataFlow, cancellationToken?: CancellationToken): DuplexDataSource<T>;
    cancelAll(): void;
}
//# sourceMappingURL=duplex_data_source.d.ts.map