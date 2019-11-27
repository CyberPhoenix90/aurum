import { CancellationToken } from '../utilities/cancellation_token';
import { Callback } from '../utilities/common';
import { EventEmitter } from './event_emitter';
import { Predicate } from '../utilities/common';
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
    debounce(time: number, cancellationToken?: CancellationToken): DataSource<T>;
    buffer(time: number, cancellationToken?: CancellationToken): DataSource<T[]>;
    queue(time: number, cancellationToken?: CancellationToken): ArrayDataSource<T>;
    pick(key: keyof T, cancellationToken?: CancellationToken): DataSource<T[typeof key]>;
    cancelAll(): void;
}
export interface CollectionChange<T> {
    operation: 'replace' | 'append' | 'prepend' | 'remove' | 'swap';
    count?: number;
    index: number;
    index2?: number;
    target?: T;
    items: T[];
    newState: T[];
}
export declare class ArrayDataSource<T> {
    protected data: T[];
    onChange: EventEmitter<CollectionChange<T>>;
    constructor(initialData?: T[]);
    get length(): number;
    getData(): T[];
    get(index: number): T;
    set(index: number, item: T): void;
    swap(indexA: number, indexB: number): void;
    swapItems(itemA: T, itemB: T): void;
    push(...items: T[]): void;
    unshift(...items: T[]): void;
    pop(): T;
    merge(newData: T[]): void;
    removeRight(count: number): void;
    removeLeft(count: number): void;
    remove(item: T): void;
    clear(): void;
    shift(): T;
    toArray(): T[];
    filter(callback: Predicate<T>, cancellationToken?: CancellationToken): FilteredArrayView<T>;
    forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
    toDataSource(): DataSource<T[]>;
}
export declare class FilteredArrayView<T> extends ArrayDataSource<T> {
    private viewFilter;
    private parent;
    constructor(parent: ArrayDataSource<T>, filter: Predicate<T>, cancellationToken?: CancellationToken);
    updateFilter(filter: Predicate<T>): void;
    protected refresh(): void;
}
//# sourceMappingURL=data_source.d.ts.map