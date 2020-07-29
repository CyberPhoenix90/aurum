export enum OperationType {
	FILTER,
	NOOP,
	MAP,
	DELAY,
	MAP_DELAY,
	DELAY_FILTER,
	MAP_DELAY_FILTER
}

export interface DataSourceOperator<T, M> {
	operationType: OperationType;
	typescriptBugWorkaround?: (value: T) => M;
	name: string;
}

export interface DataSourceFilterOperator<T> extends DataSourceOperator<T, T> {
	operationType: OperationType.FILTER;
	operation: (value: T) => boolean;
}

export interface DataSourceMapOperator<T, M> extends DataSourceOperator<T, M> {
	operationType: OperationType.MAP;
	operation: (value: T) => M;
}

export interface DataSourceNoopOperator<T> extends DataSourceOperator<T, T> {
	operationType: OperationType.NOOP;
	operation: (value: T) => T;
}

export interface DataSourceDelayOperator<T> extends DataSourceOperator<T, T> {
	operationType: OperationType.DELAY;
	operation: (value: T) => Promise<T>;
}

export interface DataSourceMapDelayOperator<T, M> extends DataSourceOperator<T, M> {
	operationType: OperationType.MAP_DELAY;
	operation: (value: T) => Promise<M>;
}

export interface DataSourceMapDelayFilterOperator<T, M> extends DataSourceOperator<T, M> {
	operationType: OperationType.MAP_DELAY_FILTER;
	operation: (value: T) => Promise<{ item: M; cancelled: boolean }>;
}

export interface DataSourceDelayFilterOperator<T> extends DataSourceOperator<T, T> {
	operationType: OperationType.DELAY_FILTER;
	operation: (value: T) => Promise<boolean>;
}
