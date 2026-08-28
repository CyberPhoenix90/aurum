import { DataSource, ReadOnlyDataSource } from '@aurumjs/rendering';

export function deref<T>(source: ReadOnlyDataSource<T> | T): T {
    if (source instanceof DataSource) {
        return source.value;
    } else {
        return source as T;
    }
}
