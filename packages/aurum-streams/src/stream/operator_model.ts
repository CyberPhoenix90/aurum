import { CancellationToken } from '../utilities/cancellation_token.js';

export enum OperationType {
    FILTER,
    NOOP,
    MAP,
    SPREAD,
    DELAY,
    MAP_DELAY,
    DELAY_FILTER,
    MAP_DELAY_FILTER
}

export type AsyncOperatorConcurrency = 'parallel' | 'ordered' | 'latest';

export interface OperatorContext {
    readonly cancellationToken: CancellationToken;
}

interface SourceOperator {
    operationType: OperationType;
    name: string;
}

export interface DataSourceOperator<T, M> extends SourceOperator {
    /** Creates the state and resources owned by one attached pipeline. */
    bind?(context: OperatorContext): DataSourceOperator<T, M>;
    /** @internal Carries input/output variance for TypeScript's structural type system. */
    readonly inputOutputType?: (value: T) => M;
}

export interface DuplexDataSourceOperator<T, M> extends SourceOperator {
    bind?(context: OperatorContext): DuplexDataSourceOperator<T, M>;
    /** @internal Carries input/output variance for TypeScript's structural type system. */
    readonly inputOutputType?: (value: T) => M;
}

export type DataSourceOperatorOutput<Input, Operators extends readonly DataSourceOperator<any, any>[]> =
    Operators extends readonly [DataSourceOperator<Input, infer Output>, ...infer Rest]
        ? Rest extends readonly DataSourceOperator<any, any>[]
            ? DataSourceOperatorOutput<Output, Rest>
            : Output
        : Input;

export type DataSourceOperatorChain<Input, Operators extends readonly DataSourceOperator<any, any>[]> =
    Operators extends readonly []
        ? readonly []
        : Operators extends readonly [infer First, ...infer Rest]
          ? First extends DataSourceOperator<Input, infer Output>
              ? Rest extends readonly DataSourceOperator<any, any>[]
                  ? readonly [First, ...DataSourceOperatorChain<Output, Rest>]
                  : never
              : never
          : never;

export type DataSourceTransformRestArguments<Input, Operators extends readonly DataSourceOperator<any, any>[]> =
    | (Operators & DataSourceOperatorChain<Input, Operators>)
    | [...(Operators & DataSourceOperatorChain<Input, Operators>), CancellationToken];

export type DuplexDataSourceOperatorOutput<Input, Operators extends readonly DuplexDataSourceOperator<any, any>[]> =
    Operators extends readonly [DuplexDataSourceOperator<Input, infer Output>, ...infer Rest]
        ? Rest extends readonly DuplexDataSourceOperator<any, any>[]
            ? DuplexDataSourceOperatorOutput<Output, Rest>
            : Output
        : Input;

export type DuplexDataSourceOperatorChain<Input, Operators extends readonly DuplexDataSourceOperator<any, any>[]> =
    Operators extends readonly []
        ? readonly []
        : Operators extends readonly [infer First, ...infer Rest]
          ? First extends DuplexDataSourceOperator<Input, infer Output>
              ? Rest extends readonly DuplexDataSourceOperator<any, any>[]
                  ? readonly [First, ...DuplexDataSourceOperatorChain<Output, Rest>]
                  : never
              : never
          : never;

export type DuplexDataSourceTransformRestArguments<Input, Operators extends readonly DuplexDataSourceOperator<any, any>[]> =
    | (Operators & DuplexDataSourceOperatorChain<Input, Operators>)
    | [...(Operators & DuplexDataSourceOperatorChain<Input, Operators>), CancellationToken];

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

export interface DataSourceSpreadOperator<T, M> extends DataSourceOperator<T, M> {
    operationType: OperationType.SPREAD;
    operation: (value: T) => M[];
}

export interface DataSourceNoopOperator<T> extends DataSourceOperator<T, T> {
    operationType: OperationType.NOOP;
    operation: (value: T) => void;
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
    operationUp: (value: M) => Promise<{ item: T; cancelled: boolean }>;
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
