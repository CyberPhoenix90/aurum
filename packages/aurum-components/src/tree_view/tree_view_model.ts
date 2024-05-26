import { ArrayDataSource, DataSource, ReadOnlyArrayDataSource, ReadOnlyDataSource, Renderable, DuplexDataSource } from 'aurumjs';

export interface TreeEntry<T> {
    tag?: T;
    title?: string | ReadOnlyDataSource<string>;
    name: string | ReadOnlyDataSource<string>;
    icon?: string | Renderable;
    renderable?: Renderable;
    children?: ArrayDataSource<TreeEntry<T>> | ReadOnlyArrayDataSource<TreeEntry<T>> | TreeEntry<T>[];
    open?: DataSource<boolean> | DuplexDataSource<boolean>;
    lazyLoad?: () => Promise<TreeEntry<T>[]>;
}
