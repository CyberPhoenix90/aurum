import { DataSource, ReadOnlyDataSource } from '@aurum/rendering';

export function deref<T>(source: ReadOnlyDataSource<T> | T): T {
	if (source instanceof DataSource) {
		return source.value;
	} else {
		return source as T;
	}
}
