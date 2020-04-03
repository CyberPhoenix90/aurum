import { CancellationToken } from '../utilities/cancellation_token';
import { Callback, ThenArg, Predicate } from '../utilities/common';
export declare class DataSource<T> {
    value: T;
    private updating;
    private updateEvent;
    constructor(initialValue?: T);
    update(newValue: T): void;
    listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    filter(callback: (newValue: T, oldValue: T) => boolean, cancellationToken?: CancellationToken): DataSource<T>;
    max(cancellationToken?: CancellationToken): DataSource<T>;
    min(cancellationToken?: CancellationToken): DataSource<T>;
    pipe(targetDataSource: DataSource<T>, cancellationToken?: CancellationToken): void;
    map<D>(callback: (value: T) => D, cancellationToken?: CancellationToken): DataSource<D>;
    tap(callback: (value: T) => void, cancellationToken?: CancellationToken): DataSource<T>;
    await<R extends ThenArg<T>>(cancellationToken?: CancellationToken): DataSource<R>;
    unique(cancellationToken?: CancellationToken): DataSource<T>;
    diff(cancellationToken?: CancellationToken): DataSource<{
        new: T;
        old: T;
    }>;
    reduce(reducer: (p: T, c: T) => T, initialValue: T, cancellationToken?: CancellationToken): DataSource<T>;
    aggregate<D, E>(otherSource: DataSource<D>, combinator: (self: T, other: D) => E, cancellationToken?: CancellationToken): DataSource<E>;
    aggregateThree<D, E, F>(second: DataSource<D>, third: DataSource<E>, combinator: (self: T, second: D, third: E) => F, cancellationToken?: CancellationToken): DataSource<F>;
    aggregateFour<D, E, F, G>(second: DataSource<D>, third: DataSource<E>, fourth: DataSource<F>, combinator: (self: T, second: D, third: E, fourth: F) => G, cancellationToken?: CancellationToken): DataSource<G>;
    stringJoin(seperator: string, cancellationToken?: CancellationToken): DataSource<string>;
    combine(otherSources: DataSource<T>[], cancellationToken?: CancellationToken): DataSource<T>;
    delay(time: number, cancellationToken?: CancellationToken): DataSource<T>;
    debounce(time: number, cancellationToken?: CancellationToken): DataSource<T>;
    throttle(time: number, cancellationToken?: CancellationToken): DataSource<T>;
    buffer(time: number, cancellationToken?: CancellationToken): DataSource<T[]>;
    accumulate(cancellationToken?: CancellationToken): ArrayDataSource<T>;
    pick(key: keyof T, cancellationToken?: CancellationToken): DataSource<T[typeof key]>;
    cancelAll(): void;
}
export interface CollectionChange<T> {
    operation: 'replace' | 'swap' | 'add' | 'remove';
    operationDetailed: 'replace' | 'append' | 'prepend' | 'removeRight' | 'removeLeft' | 'remove' | 'swap' | 'clear';
    count?: number;
    index: number;
    index2?: number;
    target?: T;
    items: T[];
    newState: T[];
}
export declare class ArrayDataSource<T> {
    protected data: T[];
    private updateEvent;
    private lengthSource;
    constructor(initialData?: T[]);
    listenAndRepeat(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void>;
    listen(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void>;
    get length(): DataSource<number>;
    getData(): T[];
    get(index: number): T;
    set(index: number, item: T): void;
    swap(indexA: number, indexB: number): void;
    swapItems(itemA: T, itemB: T): void;
    appendArray(items: T[]): void;
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
    sort(comparator: (a: T, b: T) => number, cancellationToken?: CancellationToken): SortedArrayView<T>;
    map<D>(mapper: (data: T) => D, cancellationToken?: CancellationToken): MappedArrayView<T, D>;
    filter(callback: Predicate<T>, dependencies?: DataSource<any>[], cancellationToken?: CancellationToken): FilteredArrayView<T>;
    forEach(callbackfn: (value: T, index: number, array: T[]) => void): void;
    private update;
}
export declare class MappedArrayView<D, T> extends ArrayDataSource<T> {
    private mapper;
    constructor(parent: ArrayDataSource<D>, mapper: (a: D) => T, cancellationToken?: CancellationToken);
}
export declare class SortedArrayView<T> extends ArrayDataSource<T> {
    private comparator;
    constructor(parent: ArrayDataSource<T>, comparator: (a: T, b: T) => number, cancellationToken?: CancellationToken);
}
export declare class FilteredArrayView<T> extends ArrayDataSource<T> {
    private viewFilter;
    private parent;
    constructor(parent: ArrayDataSource<T> | T[], filter?: Predicate<T>, cancellationToken?: CancellationToken);
    updateFilter(filter: Predicate<T>): number;
    refresh(): void;
}
//# sourceMappingURL=data_source.d.ts.map