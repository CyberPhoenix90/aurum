import { DataSource } from './data_source';
import { Callback } from '../utilities/common';
import { CancellationToken } from '../utilities/cancellation_token';
export interface ObjectChange<T, K extends keyof T> {
    key: K;
    oldValue: T[K];
    newValue: T[K];
}
export declare class ObjectDataSource<T> {
    protected data: T;
    private listeners;
    private listenersOnKey;
    constructor(initialData: T);
    pick(key: keyof T, cancellationToken?: CancellationToken): DataSource<T[typeof key]>;
    listen(callback: Callback<ObjectChange<T, keyof T>>, cancellationToken?: CancellationToken): Callback<void>;
    listenOnKeyAndRepeat<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, K>>, cancellationToken?: CancellationToken): Callback<void>;
    listenOnKey<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, K>>, cancellationToken?: CancellationToken): Callback<void>;
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    assign(newData: Partial<T>): void;
    toObject(): T;
    toDataSource(): DataSource<T>;
}
//# sourceMappingURL=object_data_source.d.ts.map