import { CancellationToken } from '../utilities/cancellation_token.js';
import { Callback } from '../utilities/common.js';
import { EventEmitter } from '../utilities/event_emitter.js';
import { ArrayDataSource, DataSource } from './data_source.js';
import { DuplexDataSource } from './duplex_data_source.js';

export interface ObjectChange<T, K extends keyof T> {
    key: K;
    oldValue: T[K];
    newValue: T[K];
    deleted?: boolean;
}

export class ObjectDataSource<T> {
    protected data: T;
    private updateEvent: EventEmitter<ObjectChange<T, keyof T>>;
    private updateEventOnKey: Map<keyof T, EventEmitter<ObjectChange<T, keyof T>>>;

    constructor(initialData: T) {
        this.data = initialData;
        this.updateEvent = new EventEmitter();
        this.updateEventOnKey = new Map();
    }

    public static toObjectDataSource<T>(value: T | ObjectDataSource<T>): ObjectDataSource<T> {
        if (value instanceof ObjectDataSource) {
            return value;
        } else {
            return new ObjectDataSource(value);
        }
    }

    public toString(): string {
        return this.data.toString();
    }

    public pickObject<K extends keyof T>(key: K, cancellationToken?: CancellationToken): ObjectDataSource<T[K]> {
        if (typeof this.data[key] === 'object') {
            const subDataSource: ObjectDataSource<T[K]> = new ObjectDataSource(this.data[key]);

            subDataSource.listen((change) => {
                if (change.deleted) {
                    delete this.data[key][change.key];
                } else {
                    this.get(key)[change.key] = change.newValue as any;
                }
            }, cancellationToken);

            this.listenOnKey(key, (v) => {
                if (typeof v.newValue === 'object') {
                    if (v.newValue !== subDataSource.data) {
                        subDataSource.merge(v.newValue);
                    }
                } else {
                    subDataSource.clear();
                }
            });

            return subDataSource;
        } else {
            throw new Error('Cannot pick a non object key');
        }
    }

    public pickArray<K extends keyof T>(key: K, cancellationToken?: CancellationToken): ArrayDataSource<FlatArray<T[K], 1>> {
        if (Array.isArray(this.data[key])) {
            const subDataSource: ArrayDataSource<FlatArray<T[K], 1>> = new ArrayDataSource(this.data?.[key] as any);

            subDataSource.listen((change) => {
                this.set(key, change.newState as any);
            }, cancellationToken);

            this.listenOnKey(key, (v) => {
                if (Array.isArray(v.newValue)) {
                    if (v.newValue.length !== subDataSource.length.value || !subDataSource.getData().every((item, index) => v.newValue[index] === item)) {
                        subDataSource.merge(v.newValue);
                    }
                } else {
                    subDataSource.clear();
                }
            });

            return subDataSource;
        } else {
            throw new Error('Cannot pick a non array key');
        }
    }

    /**
     * Creates a datasource for a single key of the object
     * @param key
     * @param cancellationToken
     */
    public pick<K extends keyof T>(key: K, cancellationToken?: CancellationToken): DataSource<T[K]> {
        const subDataSource: DataSource<T[K]> = new DataSource(this.data?.[key]);

        subDataSource.listen(() => {
            this.set(key, subDataSource.value);
        }, cancellationToken);

        this.listenOnKey(
            key,
            (v) => {
                if (subDataSource.value !== v.newValue) {
                    subDataSource.update(v.newValue);
                }
            },
            cancellationToken
        );

        return subDataSource;
    }

    /**
     * Creates a duplexdatasource for a single key of the object
     * @param key
     * @param cancellationToken
     */
    public pickDuplex<K extends keyof T>(key: K, cancellationToken?: CancellationToken): DuplexDataSource<T[K]> {
        const subDataSource: DuplexDataSource<T[K]> = new DuplexDataSource(this.data?.[key]);
        subDataSource.listenUpstream((v) => {
            this.set(key, v);
        });

        this.listenOnKey(
            key,
            (v) => {
                if (subDataSource.value !== v.newValue) {
                    subDataSource.updateDownstream(v.newValue);
                }
            },
            cancellationToken
        );

        return subDataSource;
    }

    /**
     * Listen to changes of the object
     */
    public listen(callback: Callback<ObjectChange<T, keyof T>>, cancellationToken?: CancellationToken): Callback<void> {
        return this.updateEvent.subscribe(callback, cancellationToken).cancel;
    }

    public map<D>(mapper: (key: keyof T) => D): ArrayDataSource<D> {
        const stateMap: Map<string | number | Symbol, D> = new Map<string | number | Symbol, D>();
        const result = new ArrayDataSource<D>();
        this.listenAndRepeat((change) => {
            if (change.deleted && stateMap.has(change.key)) {
                const item = stateMap.get(change.key);
                result.remove(item);
                stateMap.delete(change.key);
            } else if (stateMap.has(change.key)) {
                const newItem = mapper(change.key);
                result.replace(stateMap.get(change.key), newItem);
                stateMap.set(change.key, newItem);
            } else if (!stateMap.has(change.key) && !change.deleted) {
                const newItem = mapper(change.key);
                result.push(newItem);
                stateMap.set(change.key, newItem);
            }
        });

        return result;
    }

    /**
     * Same as listen but will immediately call the callback with the current value of each key
     */
    public listenAndRepeat(callback: Callback<ObjectChange<T, keyof T>>, cancellationToken?: CancellationToken): Callback<void> {
        const c = this.updateEvent.subscribe(callback, cancellationToken).cancel;
        for (const key in this.data) {
            callback({
                key,
                newValue: this.data[key],
                oldValue: undefined,
                deleted: false
            });
        }
        return c;
    }

    /**
     * Same as listenOnKey but will immediately call the callback with the current value first
     */
    public listenOnKeyAndRepeat<K extends keyof T>(
        key: K,
        callback: Callback<ObjectChange<T, keyof T>>,
        cancellationToken?: CancellationToken
    ): Callback<void> {
        callback({
            key,
            newValue: this.data[key],
            oldValue: undefined
        });

        return this.listenOnKey(key, callback, cancellationToken);
    }

    /**
     * Listen to changes of a single key of the object
     */
    public listenOnKey<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, K>>, cancellationToken?: CancellationToken): Callback<void> {
        if (!this.updateEventOnKey.has(key)) {
            this.updateEventOnKey.set(key, new EventEmitter());
        }
        const event = this.updateEventOnKey.get(key);
        return event.subscribe(callback as any, cancellationToken).cancel;
    }

    /**
     * Returns all the keys of the object in the source
     */
    public keys(): string[] {
        return Object.keys(this.data);
    }

    /**
     * Returns all the values of the object in the source
     */
    public values(): any {
        return Object.values(this.data);
    }

    /**
     * get the current value of a key of the object
     * @param key
     */
    public get<K extends keyof T>(key: K): T[K] {
        return this.data[key];
    }

    /**
     * delete a key from the object
     * @param key
     * @param value
     */
    public delete<K extends keyof T>(key: K): void {
        const old = this.data[key];
        delete this.data[key];
        this.updateEvent.fire({ oldValue: old, key, newValue: undefined, deleted: true });
        if (this.updateEventOnKey.has(key)) {
            this.updateEventOnKey.get(key).fire({ oldValue: old, key, newValue: undefined });
        }
    }

    /**
     * set the value for a key of the object
     * @param key
     * @param value
     */
    public set<K extends keyof T>(key: K, value: T[K]): void {
        if (this.data[key] === value) {
            return;
        }

        const old = this.data[key];
        this.data[key] = value;
        this.updateEvent.fire({ oldValue: old, key, newValue: this.data[key] });
        if (this.updateEventOnKey.has(key)) {
            this.updateEventOnKey.get(key).fire({ oldValue: old, key, newValue: this.data[key] });
        }
    }

    /**
     * Merge the key value pairs of an object into this object non recursively
     * @param newData
     */
    public assign(newData: Partial<T> | ObjectDataSource<T>): void {
        if (newData instanceof ObjectDataSource) {
            for (const key of newData.keys()) {
                this.set(key as keyof T, newData.data[key]);
            }
        } else {
            for (const key of Object.keys(newData)) {
                this.set(key as keyof T, newData[key]);
            }
        }
    }

    /**
     * Merge the key value pairs of an object into this object non recursively and delete properties that do not exist in the newData
     * @param newData
     */
    public merge(newData: Partial<T> | ObjectDataSource<T>): void {
        const keys = new Set<string>(Object.keys(this.data));
        if (newData instanceof ObjectDataSource) {
            for (const key of newData.keys()) {
                keys.delete(key);
                this.set(key as keyof T, newData.data[key]);
            }
        } else {
            for (const key of Object.keys(newData)) {
                keys.delete(key);
                this.set(key as keyof T, newData[key]);
            }
        }

        for (const key of keys) {
            this.delete(key as keyof T);
        }
    }

    /**
     * Deletes all keys
     */
    public clear(): void {
        for (const key in this.data) {
            this.delete(key);
        }
    }

    public getData(): Readonly<T> {
        return this.data;
    }

    /**
     * Returns a shallow copy of the object
     */
    public toObject(): T {
        return { ...this.data };
    }

    /**
     * Returns a simplified version of this datasource
     */
    public toDataSource(): DataSource<T> {
        const stream = new DataSource(this.data);
        this.listen((s) => {
            stream.update(this.data);
        });
        return stream;
    }
}
