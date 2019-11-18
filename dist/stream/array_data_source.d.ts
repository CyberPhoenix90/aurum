import { EventEmitter } from './event_emitter';
import { DataSource } from './data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { Predicate } from '../utilities/common';
export interface CollectionChange<T> {
    operation: 'replace' | 'append' | 'prepend' | 'removeLeft' | 'removeRight' | 'remove';
    count: number;
    index: number;
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
//# sourceMappingURL=array_data_source.d.ts.map