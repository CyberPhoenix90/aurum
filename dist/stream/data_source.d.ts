import { CancellationToken } from '../utilities/cancellation_token';
import { Callback } from '../utilities/common';
export declare class DataSource<T> {
    value: T;
    private listeners;
    constructor(initialValue?: T);
    update(newValue: T): void;
    listen(callback: (value: T) => void, cancellationToken?: CancellationToken): Callback<void>;
    filter(callback: (value: T) => boolean, cancellationToken?: CancellationToken): DataSource<T>;
    pipe(targetDataSource: DataSource<T>, cancellationToken?: CancellationToken): void;
    map<D>(callback: (value: T) => D, cancellationToken?: CancellationToken): DataSource<D>;
    unique(cancellationToken?: CancellationToken): DataSource<T>;
    reduce(reducer: (p: T, c: T) => T, initialValue: T, cancellationToken?: CancellationToken): DataSource<T>;
    aggregate<D, E>(otherSource: DataSource<D>, combinator: (self: T, other: D) => E, cancellationToken?: CancellationToken): DataSource<E>;
    combine(otherSource: DataSource<T>, cancellationToken?: CancellationToken): DataSource<T>;
    pick(key: keyof T, cancellationToken?: CancellationToken): DataSource<T[typeof key]>;
    cancelAll(): void;
}
//# sourceMappingURL=data_source.d.ts.map