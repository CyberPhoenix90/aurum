import { ArrayDataSource, DataSource, ReadOnlyArrayDataSource, ReadOnlyDataSource, Renderable } from 'aurumjs';

export interface TreeEntry<T> {
    tag?: T;
    title?: string | ReadOnlyDataSource<string>;
    name: string | DataSource<string>;
    renderable?: DataSource<Renderable>;
    children?: ArrayDataSource<TreeEntry<T>> | ReadOnlyArrayDataSource<TreeEntry<T>> | TreeEntry<T>[];
    open?: DataSource<boolean>;
}
