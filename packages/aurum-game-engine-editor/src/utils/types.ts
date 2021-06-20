import { ArrayDataSource, DataSource } from 'aurumjs';

export type Reactify<T> = {
	[P in keyof T]: T[P] extends Array<infer U> ? ArrayDataSource<U> : DataSource<T[P]>;
};
