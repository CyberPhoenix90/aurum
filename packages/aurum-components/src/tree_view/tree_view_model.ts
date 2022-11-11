import { ArrayDataSource, DataSource, ReadOnlyArrayDataSource, ReadOnlyDataSource, Renderable, DuplexDataSource } from 'aurumjs';

export interface TreeEntry<T> {
    tag?: T;
    title?: string | ReadOnlyDataSource<string>;
    name: string | ReadOnlyDataSource<string>;
    renderable?: DataSource<Renderable>;
    children?: ArrayDataSource<TreeEntry<T>> | ReadOnlyArrayDataSource<TreeEntry<T>> | TreeEntry<T>[];
    open?: DataSource<boolean> | DuplexDataSource<boolean>;
}
