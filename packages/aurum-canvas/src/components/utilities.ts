import { DataSource } from 'aurumjs';

export function deref<T>(source: DataSource<T> | T): T {
	if (source instanceof DataSource) {
		return source.value;
	} else {
		return source;
	}
}
