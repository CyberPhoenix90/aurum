import { CancellationToken } from '../utilities/cancellation_token.js';
import { dsDebounce } from './data_source_operators.js';
import {
    DuplexDataSourceDelayFilterOperator,
    DuplexDataSourceFilterOperator,
    DuplexDataSourceMapOperator,
    DuplexDataSourceOperator,
    OperationType,
    OperatorContext
} from './operator_model.js';

function perDuplexPipeline<O extends DuplexDataSourceOperator<any, any>>(create: (context: OperatorContext) => O): O {
    const standaloneLifetime = new CancellationToken();
    const direct = create({ cancellationToken: standaloneLifetime });
    direct.bind = (context) => {
        standaloneLifetime.cancel();
        return create(context);
    };
    return direct;
}

export enum DataFlow {
    UPSTREAM,
    DOWNSTREAM
}

export enum DataFlowBoth {
    UPSTREAM,
    DOWNSTREAM,
    BOTH
}

export function ddsMap<T, M>(mapDown: (value: T) => M, mapUp: (value: M) => T): DuplexDataSourceMapOperator<T, M> {
    return {
        name: 'map',
        operationType: OperationType.MAP,
        operationDown: (v) => mapDown(v),
        operationUp: (v) => mapUp(v)
    };
}

/**
 * Starts a timer when an update occurs, delays the update until the timer passed if a new update arrives the initial
 * update is cancelled and the process starts again
 */
export function ddsDebounce<T>(time: number, direction?: DataFlowBoth): DuplexDataSourceDelayFilterOperator<T> {
    return perDuplexPipeline((context) => {
        const debounceDown = dsDebounce<T>(time).bind?.(context) as ReturnType<typeof dsDebounce<T>>;
        const debounceUp = dsDebounce<T>(time).bind?.(context) as ReturnType<typeof dsDebounce<T>>;
        return {
        operationType: OperationType.DELAY_FILTER,
        name: `debounce ${time}ms`,
        operationDown: (v) => {
            if (direction === undefined || direction === DataFlowBoth.DOWNSTREAM || direction === DataFlowBoth.BOTH) {
                return debounceDown.operation(v);
            } else {
                return Promise.resolve(true);
            }
        },
        operationUp: (v) => {
            if (direction === undefined || direction === DataFlowBoth.UPSTREAM || direction === DataFlowBoth.BOTH) {
                return debounceUp.operation(v);
            } else {
                return Promise.resolve(true);
            }
        }
        };
    });
}

export function ddsOneWayFlow<T>(direction: DataFlow): DuplexDataSourceFilterOperator<T> {
    if (direction === DataFlow.DOWNSTREAM) {
        return ddsFilter(
            () => true,
            () => false
        );
    } else {
        return ddsFilter(
            () => false,
            () => true
        );
    }
}

export function ddsFilter<T>(predicateDown: (value: T) => boolean, predicateUp: (value: T) => boolean): DuplexDataSourceFilterOperator<T> {
    return {
        name: 'filter',
        operationType: OperationType.FILTER,
        operationDown: (v) => predicateDown(v),
        operationUp: (v) => predicateUp(v)
    };
}

export function ddsUnique<T>(direction?: DataFlowBoth, isEqual?: (valueA: T, valueB: T) => boolean): DuplexDataSourceFilterOperator<T> {
    return perDuplexPipeline(() => {
        let lastDown: T;
        let lastUp: T;
        let primedUp = false;
        let primedDown = false;
        const equals = (a: T, b: T) => isEqual ? isEqual(a, b) : a === b || (Number.isNaN(a) && Number.isNaN(b));
        return {
        name: 'unique',
        operationType: OperationType.FILTER,
        operationDown: (v) => {
            if (direction === undefined || direction === DataFlowBoth.DOWNSTREAM || direction === DataFlowBoth.BOTH) {
                if (primedDown && equals(lastDown, v)) {
                    return false;
                } else {
                    primedDown = true;
                    lastDown = v;
                    return true;
                }
            } else {
                return true;
            }
        },
        operationUp: (v) => {
            if (direction === undefined || direction === DataFlowBoth.UPSTREAM || direction === DataFlowBoth.BOTH) {
                if (primedUp && equals(lastUp, v)) {
                    return false;
                } else {
                    lastUp = v;
                    primedUp = true;
                    return true;
                }
            } else {
                return true;
            }
        }
        };
    });
}
