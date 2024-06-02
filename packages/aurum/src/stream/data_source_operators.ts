import { CancellationToken } from '../utilities/cancellation_token.js';
import { Callback, ThenArg } from '../utilities/common.js';
import { EventEmitter } from '../utilities/event_emitter.js';
import { ArrayDataSource, DataSource } from './data_source.js';
import { DuplexDataSource } from './duplex_data_source.js';
import {
    DataSourceDelayFilterOperator,
    DataSourceDelayOperator,
    DataSourceFilterOperator,
    DataSourceMapDelayFilterOperator,
    DataSourceMapDelayOperator,
    DataSourceMapOperator,
    DataSourceNoopOperator,
    OperationType
} from './operator_model.js';
import { Stream } from './stream.js';

/**
 * Mutates an update
 */
export function dsMap<T, M>(mapper: (value: T) => M): DataSourceMapOperator<T, M> {
    return {
        name: 'map',
        operationType: OperationType.MAP,
        operation: (v) => mapper(v)
    };
}

/**
 * Forwards an update to one of two possible sources based on a condition
 */
export function dsFork<T>(
    condition: (value: T) => boolean,
    truthyPath: { update(value: T): void },
    falsyPath: { update(value: T): void }
): DataSourceNoopOperator<T> {
    return {
        name: 'fork',
        operationType: OperationType.NOOP,
        operation: (v) => {
            if (condition(v)) {
                truthyPath.update(v);
            } else {
                falsyPath.update(v);
            }
        }
    };
}

/**
 * Same as map but with an async mapper function
 */
export function dsMapAsync<T, M>(mapper: (value: T) => Promise<M>): DataSourceMapDelayOperator<T, M> {
    return {
        name: 'mapAsync',
        operationType: OperationType.MAP_DELAY,
        operation: (v) => mapper(v)
    };
}

/**
 * Changes updates to contain the value of the previous update as well as the current
 */
export function dsDiff<T>(): DataSourceMapOperator<T, { newValue: T; oldValue: T }> {
    let lastValue = undefined;
    return {
        name: 'diff',
        operationType: OperationType.MAP,
        operation: (v) => {
            let result = {
                oldValue: lastValue,
                newValue: v
            };
            lastValue = v;
            return result;
        }
    };
}

/**
 * Changes updates to contain the value of the previous update as well as the current
 */
export function dsUpdateToken<T>(): DataSourceMapOperator<T, { value: T; token: CancellationToken }> {
    let token: CancellationToken;
    return {
        name: 'diff',
        operationType: OperationType.MAP,
        operation: (v) => {
            if (token) {
                token.cancel();
            }
            token = new CancellationToken();
            return {
                token,
                value: v
            };
        }
    };
}

/**
 * Blocks updates that don't pass the filter predicate
 */
export function dsFilter<T>(predicate: (value: T) => boolean): DataSourceFilterOperator<T> {
    return {
        name: 'filter',
        operationType: OperationType.FILTER,
        operation: (v) => predicate(v)
    };
}

/**
 * Same as filter but with an async predicate function
 */
export function dsFilterAsync<T>(predicate: (value: T) => Promise<boolean>): DataSourceDelayFilterOperator<T> {
    return {
        name: 'filterAsync',
        operationType: OperationType.DELAY_FILTER,
        operation: (v) => predicate(v)
    };
}

/**
 * Only propagate an update if the value is even
 */
export function dsEven(): DataSourceFilterOperator<number> {
    return {
        name: 'even',
        operationType: OperationType.FILTER,
        operation: (v) => v % 2 === 0
    };
}

/**
 * Only propagate an update if the value is odd
 */
export function dsOdd(): DataSourceFilterOperator<number> {
    return {
        name: 'odd',
        operationType: OperationType.FILTER,
        operation: (v) => v % 2 !== 0
    };
}

/**
 * Only propagate an update if the value is lower than the previous update
 */
export function dsMin(): DataSourceFilterOperator<number> {
    let last = Number.MAX_SAFE_INTEGER;
    return {
        name: 'min',
        operationType: OperationType.FILTER,
        operation: (v) => {
            if (v < last) {
                last = v;
                return true;
            } else {
                return false;
            }
        }
    };
}

/**
 * Only propagate an update if the value is higher than the previous update
 */
export function dsMax(): DataSourceFilterOperator<number> {
    let last = Number.MIN_SAFE_INTEGER;
    return {
        name: 'max',
        operationType: OperationType.FILTER,
        operation: (v) => {
            if (v > last) {
                last = v;
                return true;
            } else {
                return false;
            }
        }
    };
}

/**
 * Ignore the first N updates where N depends on an external source
 */
export function dsSkipDynamic<T>(amountLeft: DataSource<number>): DataSourceFilterOperator<T> {
    return {
        operationType: OperationType.FILTER,
        name: 'skipDynamic',
        operation: (v) => {
            if (amountLeft.value === 0) {
                return true;
            } else {
                amountLeft.update(amountLeft.value - 1);
                return false;
            }
        }
    };
}

/**
 * Ignore the first N updates
 */
export function dsSkip<T>(amount: number): DataSourceFilterOperator<T> {
    return {
        operationType: OperationType.FILTER,
        name: `skip ${amount}`,
        operation: (v) => {
            if (amount === 0) {
                return true;
            } else {
                amount--;
                return false;
            }
        }
    };
}

/**
 * Allows only a certain number of updates to pass decreasing a counter on each pass
 * If the counter reaches 0 the updates are lost
 */
export function dsCutOff<T>(amount: number): DataSourceFilterOperator<T> {
    return {
        name: `cutoff ${amount}`,
        operationType: OperationType.FILTER,
        operation: (v) => {
            if (amount === 0) {
                return false;
            } else {
                amount--;
                return true;
            }
        }
    };
}

/**
 * Allows only a certain number of updates to pass decreasing a counter on each pass, the counter being an external
 * datasource can be changed externally.
 * If the counter reaches 0 the updates are lost
 */
export function dsCutOffDynamic<T>(amountLeft: DataSource<number>): DataSourceFilterOperator<T> {
    return {
        name: 'cutoffDynamic',
        operationType: OperationType.FILTER,
        operation: (v) => {
            if (amountLeft.value === 0) {
                return false;
            } else {
                amountLeft.update(amountLeft.value - 1);
                return true;
            }
        }
    };
}

/**
 * Allows only a certain number of updates to pass decreasing a counter on each pass, the counter being an external
 * datasource can be changed externally.
 * If the counter reaches 0 the updates are buffered until they are unlocked again
 */
export function dsSemaphore<T>(state: DataSource<number>): DataSourceDelayOperator<T> {
    return {
        operationType: OperationType.DELAY,
        name: 'semaphore',
        operation: (v) => {
            return new Promise((resolve) => {
                if (state.value > 0) {
                    state.update(state.value - 1);
                    resolve(v);
                } else {
                    const cancel = state.listen(() => {
                        if (state.value > 0) {
                            cancel();
                            state.update(state.value - 1);
                            resolve(v);
                        }
                    });
                }
            });
        }
    };
}

/**
 * Filters out updates if they have the same value as the previous update, uses reference equality by default
 */
export function dsUnique<T>(isEqual?: (valueA: T, valueB: T) => boolean): DataSourceFilterOperator<T> {
    let primed: boolean = false;
    let last: T;
    return {
        name: 'unique',
        operationType: OperationType.FILTER,
        operation: (v) => {
            if (primed && (isEqual ? isEqual(last, v) : v === last || (Number.isNaN(v) && Number.isNaN(last)))) {
                return false;
            } else {
                primed = true;
                last = v;
                return true;
            }
        }
    };
}

/**
 * Takes promises and updates with the resolved value, if multiple promises come in processes updates as promises resolve in any order
 */
export function dsAwait<T>(): DataSourceMapDelayOperator<T, ThenArg<T>> {
    return {
        name: 'await',
        operationType: OperationType.MAP_DELAY,
        operation: (v) => {
            return v as any;
        }
    };
}

/**
 * Takes promises and updates with the resolved value, if multiple promises come in makes sure the updates fire in the same order that the promises came in
 */
export function dsAwaitOrdered<T>(): DataSourceMapDelayOperator<T, ThenArg<T>> {
    const queue: any[] = [];
    const onDequeue = new EventEmitter();

    return {
        operationType: OperationType.MAP_DELAY,
        name: 'awaitOrdered',
        operation: async (v) => {
            queue.push(v);
            if (queue.length === 1) {
                return processItem();
            } else {
                const unsub = onDequeue.subscribe(async () => {
                    if (queue[0] === v) {
                        unsub.cancel();
                        return processItem();
                    }
                });
            }
        }
    };

    async function processItem() {
        await queue[0];
        const item = queue.shift();
        onDequeue.fire();
        return item;
    }
}

/**
 * awaits promise and forwards the resolved value, if a new promise comes in while the first isn't resolved then the first
 * promise will be ignored even if it resolves first and instead we focus on the newest promise. This is useful for cancellable
 * async operations where we only care about the result if it's the latest action
 */
export function dsAwaitLatest<T>(): DataSourceMapDelayFilterOperator<T, ThenArg<T>> {
    let freshnessToken: number;

    return {
        operationType: OperationType.MAP_DELAY_FILTER,
        name: 'awaitLatest',
        operation: async (v) => {
            freshnessToken = Date.now();
            const timestamp = freshnessToken;
            const resolved = await (v as any);
            if (freshnessToken === timestamp) {
                return {
                    item: resolved as any,
                    cancelled: false
                };
            } else {
                return {
                    item: undefined,
                    cancelled: true
                };
            }
        }
    };
}

/**
 * Reduces all updates down to a value
 */
export function dsReduce<T, M = T>(reducer: (p: M, c: T) => M, initialValue: M): DataSourceMapOperator<T, M> {
    let last = initialValue;
    return {
        name: 'reduce',
        operationType: OperationType.MAP,
        operation: (v) => {
            last = reducer(last, v);
            return last;
        }
    };
}

/**
 * Builds a string where each update is appened to the string optionally with a seperator
 */
export function dsStringJoin(seperator: string = ', '): DataSourceMapOperator<string, string> {
    let last: string;
    return {
        name: `stringJoin ${seperator}`,
        operationType: OperationType.MAP,
        operation: (v: string) => {
            if (last) {
                last += seperator + v;
            } else {
                last = v;
            }
            return last;
        }
    };
}

/**
 * Adds a fixed amount of lag to updates
 */
export function dsDelay<T>(time: number): DataSourceDelayOperator<T> {
    return {
        name: `delay ${time}ms`,
        operationType: OperationType.DELAY,
        operation: (v) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(v);
                }, time);
            });
        }
    };
}

/**
 * Starts a timer when an update occurs, delays the update until the timer passed if a new update arrives the initial
 * update is cancelled and the process starts again
 */
export function dsDebounce<T>(time: number): DataSourceDelayFilterOperator<T> {
    let timeout;
    let cancelled = new EventEmitter();
    return {
        operationType: OperationType.DELAY_FILTER,
        name: `debounce ${time}ms`,
        operation: (v) => {
            return new Promise((resolve) => {
                clearTimeout(timeout);
                cancelled.fire();
                cancelled.subscribeOnce(() => {
                    resolve(false);
                });
                timeout = setTimeout(() => {
                    resolve(true);
                    cancelled.cancelAll();
                }, time);
            });
        }
    };
}

/**
 * Only allow up to 1 update to propagate per frame makes update run as a microtask
 */
export function dsMicroDebounce<T>(): DataSourceDelayFilterOperator<T> {
    let scheduled;
    return {
        operationType: OperationType.DELAY_FILTER,
        name: `microDebounce`,
        operation: (v) => {
            return new Promise((resolve) => {
                if (!scheduled) {
                    scheduled = true;
                    queueMicrotask(() => {
                        scheduled = false;
                        resolve(true);
                    });
                } else {
                    resolve(false);
                }
            });
        }
    };
}

/**
 * Debounce update to occur at most one per animation frame
 */
export function dsThrottleFrame<T>(): DataSourceDelayFilterOperator<T> {
    let timeout;
    let cancelled = new EventEmitter();
    return {
        operationType: OperationType.DELAY_FILTER,
        name: `throttle frame`,
        operation: (v) => {
            return new Promise((resolve) => {
                clearTimeout(timeout);
                cancelled.fire();
                cancelled.subscribeOnce(() => {
                    resolve(false);
                });
                timeout = requestAnimationFrame(() => {
                    resolve(true);
                    cancelled.cancelAll();
                });
            });
        }
    };
}

/**
 * May or may not block all updates based on the state provided by another source
 * lock state
 * false => updates pass through
 * true => updates are blocked and dropped
 * Not suitable for synchronization purposes. Use dsCriticalSection instead
 */
export function dsLock<T>(state: DataSource<boolean>): DataSourceFilterOperator<T> {
    return {
        name: 'lock',
        operationType: OperationType.FILTER,
        operation: (v) => {
            if (!state.value) {
                return true;
            } else {
                return false;
            }
        }
    };
}

/**
 * Allows at most one update per N milliseconds to pass through
 * Supports nanosecond scale precision by using decimal numbers
 */
export function dsThrottle<T>(time: number): DataSourceFilterOperator<T> {
    let lastCall = 0;
    return {
        name: `throttle ${time}ms`,
        operationType: OperationType.FILTER,
        operation: (v) => {
            if (performance.now() - lastCall > time) {
                lastCall = performance.now();
                return true;
            } else {
                return false;
            }
        }
    };
}

/**
 * Allows at most one update per N milliseconds to pass through
 * Supports nanosecond scale precision by using decimal numbers
 * @param time time in milliseconds
 * @param options buffer if true will buffer updates that come in while the throttle is active and release them when the throttle is released otherwise they are dropped
 */
export function dsThrottleBuffer<T>(
    time: number,
    options?: {
        highWaterMark?: number;
        onHighWaterMark?: () => void;
        maxBufferSize: number;
    }
): DataSourceDelayFilterOperator<T> {
    let lastCall = 0;
    const buffer: Array<(result: boolean) => void> = [];
    let nextScheduled = false;

    function next() {
        if (buffer.length > 0 && performance.now() - lastCall > time) {
            const resolve = buffer.shift();
            lastCall = performance.now();
            resolve(true);
        }
        if (buffer.length > 0) {
            nextScheduled = true;
            setTimeout(() => {
                next();
            }, time - (performance.now() - lastCall));
        } else {
            nextScheduled = false;
        }
    }

    return {
        name: `throttle buffer ${time}ms`,
        operationType: OperationType.DELAY_FILTER,
        operation: async (v) => {
            if (buffer.length === 0 && performance.now() - lastCall > time) {
                lastCall = performance.now();
                return true;
            } else {
                if (options.maxBufferSize && buffer.length >= options.maxBufferSize) {
                    return false;
                }

                let res;
                const promise = new Promise<boolean>((resolve) => {
                    res = resolve;
                });

                buffer.push(res);

                if (options.highWaterMark && buffer.length >= options.highWaterMark) {
                    options.onHighWaterMark();
                }

                if (!nextScheduled) {
                    next();
                }
                return promise;
            }
        }
    };
}

/**
 * Batches individual updates into an array based on either time, max batch size or a custom predicate
 */
export function dsBuffer<T>(config: {
    time?: number;
    maxBatchSize?: number;
    // custom predicate to determine if an item should be included in the batch. Return true to include the item in the batch and false to flush the batch and put the new item in a new batch
    canBatch?: (item: T, batch: readonly T[]) => boolean;
}): DataSourceMapDelayFilterOperator<T, T[]> {
    let buffer = [];
    let resolve;
    let promise;
    let timeout;

    if (!config && !config.time && !config.maxBatchSize && !config.canBatch) {
        throw new Error('At least one of time, maxBatchSize or batchPredicate must be provided');
    }

    const { time, maxBatchSize, canBatch } = config;
    let name = 'buffer';
    if (time) {
        name += ` time ${time}ms`;
    }

    if (maxBatchSize) {
        name += ` maxBatchSize ${maxBatchSize}`;
    }

    if (canBatch) {
        name += ` custom predicate`;
    }
    return {
        name,
        operationType: OperationType.MAP_DELAY_FILTER,
        operation: (v) => {
            let isNewBatch = promise === undefined;
            if (!promise) {
                promise = new Promise((res) => {
                    resolve = res;
                });
            }

            if (canBatch && buffer.length > 0 && !canBatch(v, buffer)) {
                flush();
            }

            buffer.push(v);

            if (maxBatchSize && buffer.length >= maxBatchSize) {
                flush();
            }

            if (time && isNewBatch) {
                timeout = setTimeout(() => {
                    flush();
                }, time);
            }

            // The update is suspended until the batch is resolved
            if (isNewBatch) {
                return promise;
            } else {
                // Updates coming in while the batch is being processed are added to the batch and cancelled from the stream
                return Promise.resolve({
                    cancelled: true
                });
            }

            function flush() {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = undefined;
                }
                resolve({
                    cancelled: false,
                    item: buffer
                });
                buffer = [];
                promise = undefined;
            }
        }
    };
}

/**
 * Extracts only the value of a key of the update value
 */
export function dsPick<T, K extends keyof T>(key: K): DataSourceMapOperator<T, T[K]> {
    return {
        name: `pick ${key.toString()}`,
        operationType: OperationType.MAP,
        operation: (v) => {
            if (v !== undefined && v !== null) {
                return v[key];
            } else {
                return v as null | undefined;
            }
        }
    };
}

/**
 * Forwards an event to another source
 */
export function dsPipe<T>(target: DataSource<T> | DuplexDataSource<T> | Stream<T, any>): DataSourceNoopOperator<T> {
    return {
        name: `pipe ${target.name}`,
        operationType: OperationType.NOOP,
        operation: (v) => {
            if (target instanceof DataSource || target instanceof Stream) {
                target.update(v);
            } else {
                target.updateDownstream(v);
            }
        }
    };
}

/**
 * Same as pipe except for duplex data sources it pipes upstream
 */
export function dsPipeUp<T>(target: DataSource<T> | DuplexDataSource<T> | Stream<T, any>): DataSourceNoopOperator<T> {
    return {
        name: `pipeup ${target.name}`,
        operationType: OperationType.NOOP,
        operation: (v) => {
            if (target instanceof DataSource || target instanceof Stream) {
                target.update(v);
            } else {
                target.updateUpstream(v);
            }
        }
    };
}

/**
 * Lets you keep a history of the updates of a source by pushing it onto an array datasource
 */
export function dsHistory<T>(
    reportTarget: ArrayDataSource<T>,
    generations?: number,
    cancellationToken: CancellationToken = new CancellationToken()
): DataSourceNoopOperator<T> {
    return {
        operationType: OperationType.NOOP,
        name: `history`,
        operation: (v) => {
            if (!cancellationToken.isCancelled) {
                if (generations) {
                    if (reportTarget.length.value >= generations) {
                        reportTarget.removeLeft(reportTarget.length.value - generations);
                    }
                }
                reportTarget.push(v);
            }
        }
    };
}

/**
 * Monitors the number of events per interval
 */
export function dsThroughputMeter<T>(
    reportTarget: DataSource<number>,
    interval: number,
    cancellationToken: CancellationToken = new CancellationToken()
): DataSourceNoopOperator<T> {
    let amount = 0;
    cancellationToken.setInterval(() => {
        reportTarget.update(amount);
        amount = 0;
    }, interval);

    return {
        operationType: OperationType.NOOP,
        name: `throughput meter`,
        operation: (v) => {
            amount++;
        }
    };
}

/**
 * Allows inserting a callback that gets called with an update
 */
export function dsTap<T>(cb: Callback<T>): DataSourceNoopOperator<T> {
    return {
        name: 'tap',
        operationType: OperationType.NOOP,
        operation: (v) => {
            cb(v);
        }
    };
}

/**
 * Pipes updates to the targets in round-robin fashion
 */
export function dsLoadBalance<T>(targets: Array<DataSource<T> | DuplexDataSource<T> | Stream<T, any>>): DataSourceNoopOperator<T> {
    let i = 0;

    return {
        name: `loadBalance [${targets.map((v) => v.name).join()}]`,
        operationType: OperationType.NOOP,
        operation: (v) => {
            const target = targets[i++];
            if (i >= targets.length) {
                i = 0;
            }
            if (target instanceof DataSource || target instanceof Stream) {
                target.update(v);
            } else {
                target.updateDownstream(v);
            }
        }
    };
}

/**
 * Logs updates to the console
 */
export function dsLog<T>(prefix: string = '', suffix: string = ''): DataSourceNoopOperator<T> {
    return {
        name: `log`,
        operationType: OperationType.NOOP,
        operation: (v) => {
            console.log(`${prefix}${v}${suffix}`);
        }
    };
}

export function dsPipeAll<T>(...sources: Array<DataSource<T> | DuplexDataSource<T> | Stream<T, any>>): DataSourceNoopOperator<T> {
    return {
        name: `pipeAll [${sources.map((v) => v.name).join()}]`,
        operationType: OperationType.NOOP,
        operation: (v) => {
            sources.forEach((source) => {
                if (source instanceof DataSource || source instanceof Stream) {
                    source.update(v);
                } else {
                    source.updateDownstream(v);
                }
            });
        }
    };
}

export function dsAccumulate(initialValue: number): DataSourceMapOperator<number, number> {
    let sum = initialValue;
    return {
        name: `accumulate`,
        operationType: OperationType.MAP,
        operation: (v) => {
            sum += v;
            return sum;
        }
    };
}
