export enum OperationType {
    FILTER,
    NOOP,
    MAP,
    DELAY,
    MAP_DELAY,
    DELAY_FILTER,
    MAP_DELAY_FILTER
}

interface SourceOperator {
    operationType: OperationType;
    name: string;
}

export interface DataSourceOperator<T, M> extends SourceOperator {
    //Inference only works if the types are used despite the fact that the generic types are only used to indicate what type goes in and what type comes out which cannot be described in a way that typescript understands
    typescriptLimitationWorkaround?: (value: T) => M;
}

export interface DuplexDataSourceOperator<T, M> extends SourceOperator {
    //Inference only works if the types are used despite the fact that the generic types are only used to indicate what type goes in and what type comes out which cannot be described in a way that typescript understands
    typescriptLimitationWorkaround?: (value: T) => M;
}

export interface DataSourceFilterOperator<T> extends DataSourceOperator<T, T> {
    operationType: OperationType.FILTER;
    operation: (value: T) => boolean;
}

export interface DuplexDataSourceFilterOperator<T> extends DuplexDataSourceOperator<T, T> {
    operationType: OperationType.FILTER;
    operationDown: (value: T) => boolean;
    operationUp: (value: T) => boolean;
}

export interface DuplexDataSourceMapOperator<T, M> extends DuplexDataSourceOperator<T, M> {
    operationType: OperationType.MAP;
    operationDown: (value: T) => M;
    operationUp: (value: M) => T;
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

export interface DuplexDataSourceMapDelayFilterOperator<T, M> extends DuplexDataSourceOperator<T, M> {
    operationType: OperationType.MAP_DELAY_FILTER;
    operationDown: (value: T) => Promise<{ item: M; cancelled: boolean }>;
    operationUp: (value: T) => Promise<{ item: M; cancelled: boolean }>;
}

export interface DataSourceDelayFilterOperator<T> extends DataSourceOperator<T, T> {
    operationType: OperationType.DELAY_FILTER;
    operation: (value: T) => Promise<boolean>;
}

export interface DuplexDataSourceDelayFilterOperator<T> extends DuplexDataSourceOperator<T, T> {
    operationType: OperationType.DELAY_FILTER;
    operationDown: (value: T) => Promise<boolean>;
    operationUp: (value: T) => Promise<boolean>;
}
