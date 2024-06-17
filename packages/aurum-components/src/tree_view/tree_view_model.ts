import { ArrayDataSource, DataSource, ReadOnlyDataSource, Renderable, DuplexDataSource } from 'aurumjs';

export interface TreeEntry<T> {
    tag?: T;
    title?: string | ReadOnlyDataSource<string>;
    name: string | ReadOnlyDataSource<string>;
    icon?: string | Renderable;
    renderable?: Renderable;
    children?: ArrayDataSource<TreeEntry<T>>;
    open?: DataSource<boolean> | DuplexDataSource<boolean>;
    lazyLoad?: () => Promise<TreeEntry<T>[]>;
}
