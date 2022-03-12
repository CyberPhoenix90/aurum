import { dsDebounce } from './data_source_operators.js';
import { DuplexDataSourceDelayFilterOperator, DuplexDataSourceFilterOperator, DuplexDataSourceMapOperator, OperationType } from './operator_model.js';

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
    const debounceDown = dsDebounce(time);
    const debounceUp = dsDebounce(time);

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
    let lastDown: T;
    let lastUp: T;
    let primedUp: boolean = false;
    let primedDown: boolean = false;

    return {
        name: 'filter',
        operationType: OperationType.FILTER,
        operationDown: (v) => {
            if (direction === undefined || direction === DataFlowBoth.DOWNSTREAM || direction === DataFlowBoth.BOTH) {
                if (primedDown && (isEqual ? isEqual(lastDown, v) : v === lastDown)) {
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
                if (primedUp && (isEqual ? isEqual(lastUp, v) : v === lastUp)) {
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
}
