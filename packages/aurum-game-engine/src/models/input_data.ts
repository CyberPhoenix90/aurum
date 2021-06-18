import { ReadOnlyDataSource, DataSource } from 'aurumjs';

export type ReadonlyData<T> = Readonly<T> | ReadOnlyDataSource<T>;
export type Data<T> = T | DataSource<T>;
