import { ArrayDataSource, BindableSource, ReadOnlyDataSource, Renderable } from 'aurumjs';

export interface TreeEntry<T> {
    tag?: T;
    title?: string | ReadOnlyDataSource<string>;
    name: string | ReadOnlyDataSource<string>;
    icon?: string | Renderable;
    renderable?: Renderable;
    children?: ArrayDataSource<TreeEntry<T>>;
    open?: BindableSource<boolean>;
    lazyLoad?: () => Promise<TreeEntry<T>[]>;
}
