import { ArrayDataSource, DataSource, Renderable } from 'aurumjs';

export interface TreeEntry<T> {
	tag?: T;
	name: string | DataSource<string>;
	renderable?: DataSource<Renderable>;
	children?: ArrayDataSource<TreeEntry<T>> | TreeEntry<T>[];
	open?: DataSource<boolean>;
}
