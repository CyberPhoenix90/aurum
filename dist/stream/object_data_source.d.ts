import { DataSource } from './data_source';
import { Callback } from '../utilities/common';
import { CancellationToken } from '../utilities/cancellation_token';
export interface ObjectChange<T, K extends keyof T> {
    key: K;
    oldValue: T[K];
    newValue: T[K];
    deleted?: boolean;
}
export declare class ObjectDataSource<T> {
    protected data: T;
    private updateEvent;
    private updateEventOnKey;
    constructor(initialData: T);
    /**
     * Creates a datasource for a single key of the object
     * @param key
     * @param cancellationToken
     */
    pick(key: keyof T, cancellationToken?: CancellationToken): DataSource<T[typeof key]>;
    /**
     * Listen to changes of the object
     */
    listen(callback: Callback<ObjectChange<T, keyof T>>, cancellationToken?: CancellationToken): Callback<void>;
    /**
     * Same as listenOnKey but will immediately call the callback with the current value first
     */
    listenOnKeyAndRepeat<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, K>>, cancellationToken?: CancellationToken): Callback<void>;
    /**
     * Listen to changes of a single key of the object
     */
    listenOnKey<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, K>>, cancellationToken?: CancellationToken): Callback<void>;
    /**
     * Returns all the keys of the object in the source
     */
    keys(): string[];
    /**
     * Returns all the values of the object in the source
     */
    values(): any;
    /**
     * get the current value of a key of the object
     * @param key
     */
    get<K extends keyof T>(key: K): T[K];
    /**
     * delete a key from the object
     * @param key
     * @param value
     */
    delete<K extends keyof T>(key: K, value: T[K]): void;
    /**
     * set the value for a key of the object
     * @param key
     * @param value
     */
    set<K extends keyof T>(key: K, value: T[K]): void;
    /**
     * Merge the key value pairs of an object into this object non recursively
     * @param newData
     */
    assign(newData: Partial<T>): void;
    /**
     * Returns a shallow copy of the object
     */
    toObject(): T;
    /**
     * Returns a simplified version of this datasource
     */
    toDataSource(): DataSource<T>;
}
//# sourceMappingURL=object_data_source.d.ts.map