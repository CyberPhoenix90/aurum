import { CancellationToken } from '../utilities/cancellation_token';
import { Callback, ThenArg, Predicate } from '../utilities/common';
/**
 * Datasources wrap a value and allow you to update it in an observable way. Datasources can be manipulated like streams and can be bound directly in the JSX syntax and will update the html whenever the value changes
 */
export declare class DataSource<T> {
    /**
     * The current value of this data source, can be changed through update
     */
    value: T;
    private updating;
    private updateEvent;
    constructor(initialValue?: T);
    /**
     * Updates the value in the data source and calls the listen callback for all listeners
     * @param newValue new value for the data source
     */
    update(newValue: T): void;
    /**
     * Same as listen but will immediately call the callback with the current value first
     * @param callback Callback to call when value is updated
     * @param cancellationToken Optional token to control the cancellation of the subscription
     * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
     */
    listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    /**
     * Subscribes to the updates of the data stream
     * @param callback Callback to call when value is updated
     * @param cancellationToken Optional token to control the cancellation of the subscription
     * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
     */
    listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    /**
     * Creates a new datasource that listenes to updates of this datasource but only propagates the updates from this source if they pass a predicate check
     * @param callback predicate check to decide if the update from the parent data source is passed down or not
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    filter(callback: (newValue: T, oldValue: T) => boolean, cancellationToken?: CancellationToken): DataSource<T>;
    /**
     * Creates a new datasource that listenes to updates of this datasource but only propagates the updates from this source if they are larger than the previous value
     * In case of strings it checks alphabetical order when deciding what is bigger or smaller
     * @param callback predicate check to decide if the update from the parent data source is passed down or not
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    max(cancellationToken?: CancellationToken): DataSource<T>;
    /**
     * Creates a new datasource that listenes to updates of this datasource but only propagates the updates from this source if they are smaller than the previous value
     * In case of strings it checks alphabetical order when deciding what is bigger or smaller
     * @param callback predicate check to decide if the update from the parent data source is passed down or not
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    min(cancellationToken?: CancellationToken): DataSource<T>;
    /**
     * Forwards all updates from this source to another
     * @param targetDataSource datasource to pipe the updates to
     * @param cancellationToken  Cancellation token to cancel the subscription the target datasource has to this datasource
     */
    pipe(targetDataSource: DataSource<T>, cancellationToken?: CancellationToken): void;
    /**
     * Creates a new datasource that is listening to updates from this datasource and transforms them with a mapper function before fowarding them to itself
     * @param callback mapper function that transforms the updates of this source
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    map<D>(callback: (value: T) => D, cancellationToken?: CancellationToken): DataSource<D>;
    /**
     * Allows tapping into the stream and calls a function for each value.
     */
    tap(callback: (value: T) => void, cancellationToken?: CancellationToken): DataSource<T>;
    /**
     * Creates a new datasource that is listening to updates from this datasource and transforms them with a mapper function before fowarding them to itself
     * @param callback mapper function that transforms the updates of this source
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    await<R extends ThenArg<T>>(cancellationToken?: CancellationToken): DataSource<R>;
    /**
     * Creates a new datasource that listens to this one and forwards updates if they are not the same as the last update
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    unique(cancellationToken?: CancellationToken): DataSource<T>;
    /**
     * Creates a new datasource that listens to this one and forwards updates revealing the previous value on each update
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    diff(cancellationToken?: CancellationToken): DataSource<{
        new: T;
        old: T;
    }>;
    /**
     * Creates a new datasource that listens to this source and combines all updates into a single value
     * @param reducer  function that aggregates an update with the previous result of aggregation
     * @param initialValue initial value given to the new source
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    reduce(reducer: (p: T, c: T) => T, initialValue: T, cancellationToken?: CancellationToken): DataSource<T>;
    /**
     * Combines two sources into a third source that listens to updates from both parent sources.
     * @param otherSource Second parent for the new source
     * @param combinator Method allowing you to combine the data from both parents on update. Called each time a parent is updated with the latest values of both parents
     * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
     */
    aggregate<D, E>(otherSource: DataSource<D>, combinator: (self: T, other: D) => E, cancellationToken?: CancellationToken): DataSource<E>;
    /**
     * Combines three sources into a fourth source that listens to updates from all parent sources.
     * @param second Second parent for the new source
     * @param third Third parent for the new source
     * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
     * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
     */
    aggregateThree<D, E, F>(second: DataSource<D>, third: DataSource<E>, combinator: (self: T, second: D, third: E) => F, cancellationToken?: CancellationToken): DataSource<F>;
    /**
     * Combines four sources into a fifth source that listens to updates from all parent sources.
     * @param second Second parent for the new source
     * @param third Third parent for the new source
     * @param fourth Fourth parent for the new source
     * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
     * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
     */
    aggregateFour<D, E, F, G>(second: DataSource<D>, third: DataSource<E>, fourth: DataSource<F>, combinator: (self: T, second: D, third: E, fourth: F) => G, cancellationToken?: CancellationToken): DataSource<G>;
    /**
     * Creates a new datasource that listens to this source and creates a string that contains all the updates with a seperator
     * @param seperator string to be placed between all the values
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    stringJoin(seperator: string, cancellationToken?: CancellationToken): DataSource<string>;
    /**
     * Like aggregate except that no combination method is needed as a result both parents must have the same type and the new stream just exposes the last update recieved from either parent
     * @param otherSource Second parent for the new source
     * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
     */
    combine(otherSources: DataSource<T>[], cancellationToken?: CancellationToken): DataSource<T>;
    /**
     * Creates a datasource that forwards all the updates after a certain time has passed, useful to introduce a delay before something triggers. Does not debounce
     * @param time
     * @param cancellationToken
     */
    delay(time: number, cancellationToken?: CancellationToken): DataSource<T>;
    /**
     * Creates a new source that listens to the updates of this source and forwards them to itself with a delay, in case many updates happen during this delay only the last update will be taken into account, effectively allowing to skip short lived values. Useful for optimizations
     * @param time Milliseconds to wait before updating
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    debounce(time: number, cancellationToken?: CancellationToken): DataSource<T>;
    /**
     * Creates a new source that listens to the updates of this source and forwards them to itself at most once per <time> milliseconds. In case many updates happen during the delay time only at most one update per delay will be taken into account,
     * effectively allowing to reduce load on the next stream. Useful for optimizations
     * @param time Milliseconds of cooldown after an update before another update can happen
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    throttle(time: number, cancellationToken?: CancellationToken): DataSource<T>;
    /**
     * Creates a new source that listens to the updates of this source. The updates are collected in an array for a period of time and then the new source updates with an array of all the updates collected in the timespan. Useful to take a rapidly changing source and process it a buffered manner. Can be used for things like batching network requests
     * @param time Milliseconds to wait before updating the returned source
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    buffer(time: number, cancellationToken?: CancellationToken): DataSource<T[]>;
    /**
     * Creates a new datasource that listens to the updates of this one. The datasource will accumulate all the updates from this source in form of an array data source. Useful to keep a history of all values from a source
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    accumulate(cancellationToken?: CancellationToken): ArrayDataSource<T>;
    /**
     * Creates a new datasource that listens to the updates of this source and forwards only a single key from the object that is held by this data source
     * @param key key to take from the object
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    pick(key: keyof T, cancellationToken?: CancellationToken): DataSource<T[typeof key]>;
    /**
     * Remove all listeners
     */
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
    /**
     * Same as listen but will immediately call the callback with an append of all existing elements first
     */
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
    /**
     * Replaces the filter function
     * @param filter
     * @returns returns new size of array view after applying filter
     */
    updateFilter(filter: Predicate<T>): number;
    /**
     * Recalculates the filter. Only needed if your filter function isn't pure and you know the result would be different if run again compared to before
     */
    refresh(): void;
}
//# sourceMappingURL=data_source.d.ts.map