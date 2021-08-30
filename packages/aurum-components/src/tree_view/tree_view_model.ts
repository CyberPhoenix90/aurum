import { ArrayDataSource, DataSource, ReadOnlyArrayDataSource, Renderable } from 'aurumjs';

export interface TreeEntry<T> {
    tag?: T;
    name: string | DataSource<string>;
    renderable?: DataSource<Renderable>;
    children?: ArrayDataSource<TreeEntry<T>> | ReadOnlyArrayDataSource<TreeEntry<T>> | TreeEntry<T>[];
    open?: DataSource<boolean>;
}
