import { CancellationToken } from '../utilities/cancellation_token.js';
import { Callback } from '../utilities/common.js';
import { EventEmitter } from '../utilities/event_emitter.js';
import {
    AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED,
    emitAurumDevtoolsUpdate,
    linkAurumDevtoolsNodes,
    registerAurumDevtoolsNode,
    setAurumDevtoolsSubscriptionCount
} from '../devtools.js';
import { ArrayDataSource, DataSource, ReadOnlyArrayDataSource, ReadOnlyDataSource } from './data_source.js';
import { DuplexDataSource } from './duplex_data_source.js';

type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

export interface ObjectSetChange<T, K extends keyof T> {
    operation: 'set';
    key: K;
    path?: PropertyKey[];
    oldValue: T[K] | undefined;
    newValue: T[K];
    deleted: false;
}

export interface ObjectDeleteChange<T, K extends keyof T> {
    operation: 'delete';
    key: K;
    path?: PropertyKey[];
    oldValue: T[K];
    newValue: undefined;
    deleted: true;
}

export type ObjectChange<T, K extends keyof T = keyof T> = ObjectSetChange<T, K> | ObjectDeleteChange<T, K>;

export interface ReadOnlyObjectDataSource<T extends object> {
    toString(): string;
    pickObject<K extends keyof T>(key: K, cancellationToken?: CancellationToken): ReadOnlyObjectDataSource<Extract<T[K], object>>;
    pickArray<K extends keyof T>(key: K, cancellationToken?: CancellationToken): ReadOnlyArrayDataSource<ArrayElement<T[K]>>;
    pick<K extends keyof T>(key: K, cancellationToken?: CancellationToken): ReadOnlyDataSource<T[K]>;
    pickDuplex<K extends keyof T>(key: K, cancellationToken?: CancellationToken): DuplexDataSource<T[K]>;
    listen(callback: Callback<ObjectChange<T>>, cancellationToken?: CancellationToken): void;
    listenAndRepeat(callback: Callback<ObjectChange<T>>, cancellationToken?: CancellationToken): void;
    map<D>(mapper: (key: keyof T, value: T[keyof T]) => D, cancellationToken?: CancellationToken): ArrayDataSource<D>;
    listenOnKey<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, K>>, cancellationToken?: CancellationToken): void;
    listenOnKeyAndRepeat<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, K>>, cancellationToken?: CancellationToken): void;
    hasKey(key: keyof T): boolean;
    keys(): (keyof T)[];
    values(): T[keyof T][];
    get<K extends keyof T>(key: K): T[K];
    getData(): Readonly<T>;
    toObject(): T;
    toDataSource(cancellationToken?: CancellationToken): DataSource<T>;
}

/** A shallow observable record with lazily allocated per-key event channels. */
export class ObjectDataSource<T extends object> implements ReadOnlyObjectDataSource<T> {
    protected data: T;
    private readonly updateEvent = new EventEmitter<ObjectChange<T>>();
    private readonly updateEventOnKey = new Map<keyof T, EventEmitter<ObjectChange<T>>>();

    constructor(initialData: T) {
        if (!isRecord(initialData)) {
            throw new TypeError('ObjectDataSource initial data must be a non-null, non-array object');
        }
        this.data = { ...initialData };
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            registerAurumDevtoolsNode(this, { kind: 'object-data-source', getValue: (target) => target.getData() });
        }
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            this.updateEvent.observeSubscriptionCount((count) => setAurumDevtoolsSubscriptionCount(this, count), false);
        }
    }

    public static toObjectDataSource<T extends object>(value: T | ObjectDataSource<T>): ObjectDataSource<T> {
        return value instanceof ObjectDataSource ? value : new ObjectDataSource(value);
    }

    public toString(): string {
        return String(this.data);
    }

    public cancelAll(): void {
        this.updateEvent.cancelAll();
        this.updateEventOnKey.forEach((event) => event.cancelAll());
        this.updateEventOnKey.clear();
    }

    public pickObject<K extends keyof T>(key: K, cancellationToken: CancellationToken = CancellationToken.forever): ObjectDataSource<Extract<T[K], object>> {
        const initialValue = this.data[key];
        if (!isRecord(initialValue)) {
            throw new Error('Cannot pick a non-object or array key as an object');
        }

        type Nested = Extract<T[K], object>;
        const subDataSource = new ObjectDataSource<Nested>(initialValue as Nested);
        linkAurumDevtoolsNodes(this, subDataSource, { kind: 'pick', label: String(key) }, cancellationToken);
        linkAurumDevtoolsNodes(subDataSource, this, { kind: 'write-back', label: String(key) }, cancellationToken);
        let syncingFromParent = false;

        subDataSource.listen((change) => {
            if (syncingFromParent) {
                return;
            }
            const path = [key as PropertyKey, ...(change.path ?? [change.key as PropertyKey])];
            this.setInternal(key, subDataSource.toObject() as T[K], path);
        }, cancellationToken);

        this.listenOnKey(
            key,
            (change) => {
                syncingFromParent = true;
                try {
                    if (change.operation === 'set' && isRecord(change.newValue)) {
                        subDataSource.merge(change.newValue as Nested);
                    } else {
                        subDataSource.clear();
                    }
                } finally {
                    syncingFromParent = false;
                }
            },
            cancellationToken
        );

        return subDataSource;
    }

    public pickArray<K extends keyof T>(key: K, cancellationToken: CancellationToken = CancellationToken.forever): ArrayDataSource<ArrayElement<T[K]>> {
        const initialValue = this.data[key];
        if (!Array.isArray(initialValue)) {
            throw new Error('Cannot pick a non-array key as an array');
        }

        type Item = ArrayElement<T[K]>;
        const subDataSource = new ArrayDataSource<Item>(initialValue as Item[]);
        linkAurumDevtoolsNodes(this, subDataSource, { kind: 'pick', label: String(key) }, cancellationToken);
        linkAurumDevtoolsNodes(subDataSource, this, { kind: 'write-back', label: String(key) }, cancellationToken);
        let syncingFromParent = false;

        subDataSource.listen((change) => {
            if (!syncingFromParent) {
                this.set(key, change.newState.slice() as T[K]);
            }
        }, cancellationToken);

        this.listenOnKey(
            key,
            (change) => {
                syncingFromParent = true;
                try {
                    if (change.operation === 'set' && Array.isArray(change.newValue)) {
                        const value = change.newValue as Item[];
                        if (!arraysEqual(subDataSource.getData(), value)) {
                            subDataSource.merge(value);
                        }
                    } else {
                        subDataSource.clear();
                    }
                } finally {
                    syncingFromParent = false;
                }
            },
            cancellationToken
        );

        return subDataSource;
    }

    public pick<K extends keyof T>(key: K, cancellationToken: CancellationToken = CancellationToken.forever): DataSource<T[K]> {
        const subDataSource = new DataSource<T[K]>(this.data[key]);
        linkAurumDevtoolsNodes(this, subDataSource, { kind: 'pick', label: String(key) }, cancellationToken);
        linkAurumDevtoolsNodes(subDataSource, this, { kind: 'write-back', label: String(key) }, cancellationToken);

        subDataSource.listen((value) => {
            if (!this.hasKey(key) || !Object.is(this.data[key], value)) {
                this.set(key, value);
            }
        }, cancellationToken);

        this.listenOnKey(
            key,
            (change) => {
                if (!Object.is(subDataSource.value, change.newValue)) {
                    subDataSource.update(change.newValue as T[K]);
                }
            },
            cancellationToken
        );

        return subDataSource;
    }

    public pickDuplex<K extends keyof T>(key: K, cancellationToken: CancellationToken = CancellationToken.forever): DuplexDataSource<T[K]> {
        const subDataSource = new DuplexDataSource<T[K]>(this.data[key]);
        linkAurumDevtoolsNodes(this, subDataSource, { kind: 'pick', label: String(key) }, cancellationToken);
        linkAurumDevtoolsNodes(subDataSource, this, { kind: 'write-back', label: String(key) }, cancellationToken);
        subDataSource.listenUpstream((value) => {
            if (!this.hasKey(key) || !Object.is(this.data[key], value)) {
                this.set(key, value);
            }
        }, cancellationToken);

        this.listenOnKey(
            key,
            (change) => {
                if (!Object.is(subDataSource.value, change.newValue)) {
                    subDataSource.updateDownstream(change.newValue as T[K]);
                }
            },
            cancellationToken
        );

        return subDataSource;
    }

    public hasKey(key: keyof T): boolean {
        return Object.prototype.hasOwnProperty.call(this.data, key);
    }

    public applyObjectChange(change: ObjectChange<T>): void {
        if (change.operation === 'delete' || change.deleted) {
            this.delete(change.key);
        } else {
            this.set(change.key, change.newValue);
        }
    }

    public listen(callback: Callback<ObjectChange<T>>, cancellationToken?: CancellationToken): void {
        this.updateEvent.subscribe(callback, cancellationToken);
    }

    public listenAndRepeat(callback: Callback<ObjectChange<T>>, cancellationToken?: CancellationToken): void {
        this.updateEvent.subscribe(callback, cancellationToken);
        for (const key of this.keys()) {
            callback({
                operation: 'set',
                key,
                newValue: this.data[key],
                oldValue: undefined,
                deleted: false
            });
        }
    }

    public listenOnKey<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, K>>, cancellationToken?: CancellationToken): void {
        let event = this.updateEventOnKey.get(key);
        if (!event) {
            event = new EventEmitter<ObjectChange<T>>();
            this.updateEventOnKey.set(key, event);
            if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
                event.observeSubscriptionCount((count) => setAurumDevtoolsSubscriptionCount(this, count, `key:${String(key)}`), false);
            }
        }
        event.subscribe(callback as Callback<ObjectChange<T>>, cancellationToken);
    }

    public listenOnKeyAndRepeat<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, K>>, cancellationToken?: CancellationToken): void {
        callback({
            operation: 'set',
            key,
            newValue: this.data[key],
            oldValue: undefined,
            deleted: false
        });
        this.listenOnKey(key, callback, cancellationToken);
    }

    public map<D>(mapper: (key: keyof T, value: T[keyof T]) => D, cancellationToken: CancellationToken = CancellationToken.forever): ArrayDataSource<D> {
        const mapped = new Map<keyof T, D>();
        for (const key of this.keys()) {
            mapped.set(key, mapper(key, this.data[key]));
        }
        const result = new ArrayDataSource<D>(this.keys().map((key) => mapped.get(key)!));
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'map' }, cancellationToken);

        this.listen((change) => {
            if (change.operation === 'delete') {
                mapped.delete(change.key);
            } else {
                mapped.set(change.key, mapper(change.key, change.newValue));
            }
            result.merge(this.keys().map((key) => mapped.get(key)!));
        }, cancellationToken);

        return result;
    }

    public keys(): (keyof T)[] {
        return Reflect.ownKeys(this.data).filter((key) => Object.prototype.propertyIsEnumerable.call(this.data, key)) as (keyof T)[];
    }

    public values(): T[keyof T][] {
        return this.keys().map((key) => this.data[key]);
    }

    public get<K extends keyof T>(key: K): T[K] {
        return this.data[key];
    }

    public delete<K extends keyof T>(key: K): void {
        if (!this.hasKey(key)) {
            return;
        }
        const oldValue = this.data[key];
        delete this.data[key];
        this.emit({ operation: 'delete', oldValue, key, newValue: undefined, deleted: true });
    }

    public set<K extends keyof T>(key: K, value: T[K]): void {
        this.setInternal(key, value);
    }

    public assign(newData: Partial<T> | ObjectDataSource<T>): void {
        const value = newData instanceof ObjectDataSource ? newData.getData() : newData;
        for (const key of ownEnumerableKeys(value) as (keyof T)[]) {
            this.set(key, value[key] as T[keyof T]);
        }
    }

    /** Replaces the shallow record, deleting keys absent from newData. */
    public merge(newData: Partial<T> | ObjectDataSource<T>): void {
        const value = newData instanceof ObjectDataSource ? newData.getData() : newData;
        const nextKeys = new Set<PropertyKey>(ownEnumerableKeys(value));
        for (const key of ownEnumerableKeys(value) as (keyof T)[]) {
            this.set(key, value[key] as T[keyof T]);
        }
        for (const key of this.keys()) {
            if (!nextKeys.has(key as PropertyKey)) {
                this.delete(key);
            }
        }
    }

    public clear(): void {
        for (const key of this.keys()) {
            this.delete(key);
        }
    }

    public getData(): Readonly<T> {
        return this.data;
    }

    public toObject(): T {
        return { ...this.data };
    }

    public toDataSource(cancellationToken: CancellationToken = CancellationToken.forever): DataSource<T> {
        const stream = new DataSource<T>(this.toObject());
        linkAurumDevtoolsNodes(this, stream, { kind: 'transform', label: 'toDataSource' }, cancellationToken);
        this.listen(() => stream.update(this.toObject()), cancellationToken);
        return stream;
    }

    private setInternal<K extends keyof T>(key: K, value: T[K], path?: PropertyKey[]): void {
        const hasKey = this.hasKey(key);
        const oldValue = this.data[key];
        if (hasKey && Object.is(oldValue, value)) {
            return;
        }
        this.data[key] = value;
        this.emit({ operation: 'set', oldValue, key, newValue: value, deleted: false, path });
    }

    private emit<K extends keyof T>(change: ObjectChange<T, K>): void {
        const genericChange = change as ObjectChange<T>;
        emitAurumDevtoolsUpdate(this, {
            kind: change.operation,
            value: this.data,
            details: { key: change.key, path: change.path, deleted: change.deleted }
        });
        this.updateEvent.fire(genericChange);
        this.updateEventOnKey.get(change.key)?.fire(genericChange);
    }
}

function isRecord(value: unknown): value is object {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function arraysEqual<T>(left: readonly T[], right: readonly T[]): boolean {
    return left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
}

function ownEnumerableKeys(value: object): PropertyKey[] {
    return Reflect.ownKeys(value).filter((key) => Object.prototype.propertyIsEnumerable.call(value, key));
}
