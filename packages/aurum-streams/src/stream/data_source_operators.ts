import { CancellationToken } from '../utilities/cancellation_token.js';
import { Callback, DataPublisher, DataWriter, ThenArg } from '../utilities/common.js';
import { ArrayDataSource, DataSource } from './data_source.js';
import {
    AsyncOperatorConcurrency,
    DataSourceDelayFilterOperator,
    DataSourceDelayOperator,
    DataSourceFilterOperator,
    DataSourceMapDelayFilterOperator,
    DataSourceMapDelayOperator,
    DataSourceMapOperator,
    DataSourceNoopOperator,
    DataSourceOperator,
    DataSourceSpreadOperator,
    OperationType,
    OperatorContext
} from './operator_model.js';

export interface AsyncOperatorOptions {
    /** parallel preserves today's merge behavior; ordered serializes work; latest drops stale results. */
    concurrency?: AsyncOperatorConcurrency;
}

function perPipeline<O extends DataSourceOperator<any, any>>(create: (context: OperatorContext) => O): O {
    const standaloneLifetime = new CancellationToken();
    const direct = create({ cancellationToken: standaloneLifetime });
    direct.bind = (context) => {
        standaloneLifetime.cancel();
        return create(context);
    };
    return direct;
}

function requireNonNegative(value: number, name: string): void {
    if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(`${name} must be a finite, non-negative number`);
    }
}

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
export function dsMapAsync<T, M>(mapper: (value: T) => Promise<M>, options?: { concurrency?: 'parallel' | 'ordered' }): DataSourceMapDelayOperator<T, M>;
export function dsMapAsync<T, M>(mapper: (value: T) => Promise<M>, options: { concurrency: 'latest' }): DataSourceMapDelayFilterOperator<T, M>;
export function dsMapAsync<T, M>(mapper: (value: T) => Promise<M>, options: AsyncOperatorOptions): DataSourceOperator<T, M>;
export function dsMapAsync<T, M>(mapper: (value: T) => Promise<M>, options?: AsyncOperatorOptions): DataSourceOperator<T, M> {
    return perPipeline((context) => {
        const concurrency = options?.concurrency ?? 'parallel';
        if (concurrency === 'latest') {
            let sequence = 0;
            return {
                name: 'mapAsync latest',
                operationType: OperationType.MAP_DELAY_FILTER,
                operation: async (value: T) => {
                    const current = ++sequence;
                    const item = await mapper(value);
                    return { item, cancelled: context.cancellationToken.isCancelled || current !== sequence };
                }
            };
        }
        if (concurrency === 'ordered') {
            let tail = Promise.resolve<unknown>(undefined);
            return {
                name: 'mapAsync ordered',
                operationType: OperationType.MAP_DELAY,
                operation: (value: T) => {
                    const result = tail.then(() => {
                        if (context.cancellationToken.isCancelled) throw new Error('Async operator cancelled');
                        return mapper(value);
                    });
                    tail = result.then(
                        (): void => undefined,
                        (): void => undefined
                    );
                    return result;
                }
            };
        }
        return { name: 'mapAsync', operationType: OperationType.MAP_DELAY, operation: mapper };
    });
}

/**
 * Changes updates to contain the value of the previous update as well as the current
 */
export function dsDiff<T>(): DataSourceMapOperator<T, { newValue: T; oldValue: T | undefined }> {
    return perPipeline(() => {
        let lastValue: T | undefined;
        return {
        name: 'diff',
        operationType: OperationType.MAP,
        operation: (v) => {
            const result = {
                oldValue: lastValue,
                newValue: v
            };
            lastValue = v;
            return result;
        }
        };
    });
}

/**
 * Changes updates to contain the value of the previous update as well as the current
 */
export function dsUpdateToken<T>(): DataSourceMapOperator<T, { value: T; token: CancellationToken }> {
    return perPipeline((context) => {
        let token: CancellationToken | undefined;
        context.cancellationToken.addCancellable(() => token?.cancel());
        return {
        name: 'updateToken',
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
    });
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
export function dsFilterAsync<T>(predicate: (value: T) => Promise<boolean>, options?: AsyncOperatorOptions): DataSourceDelayFilterOperator<T> {
    return perPipeline((context) => {
        const concurrency = options?.concurrency ?? 'parallel';
        if (concurrency === 'latest') {
            let sequence = 0;
            return {
                name: 'filterAsync latest',
                operationType: OperationType.DELAY_FILTER,
                operation: async (value) => {
                    const current = ++sequence;
                    const accepted = await predicate(value);
                    return accepted && current === sequence && !context.cancellationToken.isCancelled;
                }
            };
        }
        if (concurrency === 'ordered') {
            let tail = Promise.resolve<unknown>(undefined);
            return {
                name: 'filterAsync ordered',
                operationType: OperationType.DELAY_FILTER,
                operation: (value: T) => {
                    const result = tail.then(() => {
                        if (context.cancellationToken.isCancelled) return false;
                        return predicate(value);
                    });
                    tail = result.then(
                        (): void => undefined,
                        (): void => undefined
                    );
                    return result;
                }
            };
        }
        return { name: 'filterAsync', operationType: OperationType.DELAY_FILTER, operation: predicate };
    });
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
    return perPipeline(() => {
        let last: number;
        let primed = false;
        return {
        name: 'min',
        operationType: OperationType.FILTER,
        operation: (v) => {
            if (!primed || v < last) {
                primed = true;
                last = v;
                return true;
            } else {
                return false;
            }
        }
        };
    });
}

/**
 * Only propagate an update if the value is higher than the previous update
 */
export function dsMax(): DataSourceFilterOperator<number> {
    return perPipeline(() => {
        let last: number;
        let primed = false;
        return {
        name: 'max',
        operationType: OperationType.FILTER,
        operation: (v) => {
            if (!primed || v > last) {
                primed = true;
                last = v;
                return true;
            } else {
                return false;
            }
        }
        };
    });
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
    requireNonNegative(amount, 'amount');
    return perPipeline(() => {
        let remaining = amount;
        return {
        operationType: OperationType.FILTER,
        name: `skip ${amount}`,
        operation: (v) => {
            if (remaining === 0) {
                return true;
            } else {
                remaining--;
                return false;
            }
        }
        };
    });
}

/**
 * Allows only a certain number of updates to pass decreasing a counter on each pass
 * If the counter reaches 0 the updates are lost
 */
export function dsCutOff<T>(amount: number): DataSourceFilterOperator<T> {
    requireNonNegative(amount, 'amount');
    return perPipeline(() => {
        let remaining = amount;
        return {
        name: `cutoff ${amount}`,
        operationType: OperationType.FILTER,
        operation: (v) => {
            if (remaining === 0) {
                return false;
            } else {
                remaining--;
                return true;
            }
        }
        };
    });
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
    return perPipeline((context) => {
        const queue: Array<{ value: T; resolve: (value: T) => void }> = [];
        let drainScheduled = false;
        state.listen(scheduleDrain, context.cancellationToken);
        context.cancellationToken.addCancellable(() => {
            for (const item of queue.splice(0)) item.resolve(item.value);
        });
        const operator: DataSourceDelayOperator<T> = {
        operationType: OperationType.DELAY,
        name: 'semaphore',
        operation: (v) => {
            return new Promise((resolve) => {
                if (state.value > 0) {
                    state.update(state.value - 1);
                    resolve(v);
                } else {
                    queue.push({ value: v, resolve });
                }
            });
        }
        };
        return operator;

        function scheduleDrain() {
        if (!drainScheduled && queue.length > 0 && state.value > 0) {
            drainScheduled = true;
            queueMicrotask(() => {
                drainScheduled = false;
                while (queue.length > 0 && state.value > 0) {
                    const item = queue.shift();
                    state.update(state.value - 1);
                    item.resolve(item.value);
                }
            });
        }
        }
    });
}

/**
 * Filters out updates if they have the same value as the previous update, uses reference equality by default
 */
export function dsUnique<T>(isEqual?: (valueA: T, valueB: T) => boolean): DataSourceFilterOperator<T> {
    return perPipeline(() => {
        let primed = false;
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
    });
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
    return perPipeline(() => {
        let tail = Promise.resolve();
        return {
        operationType: OperationType.MAP_DELAY,
        name: 'awaitOrdered',
        operation: (value) => {
            const result = tail.then(() => value as any);
            tail = result.then(
                (): undefined => undefined,
                (): undefined => undefined
            );
            return result;
        }
        };
    });
}

/**
 * awaits promise and forwards the resolved value, if a new promise comes in while the first isn't resolved then the first
 * promise will be ignored even if it resolves first and instead we focus on the newest promise. This is useful for cancellable
 * async operations where we only care about the result if it's the latest action
 */
export function dsAwaitLatest<T>(): DataSourceMapDelayFilterOperator<T, ThenArg<T>> {
    return perPipeline((context) => {
        let freshnessToken = 0;
        return {
        operationType: OperationType.MAP_DELAY_FILTER,
        name: 'awaitLatest',
        operation: async (v) => {
            const token = ++freshnessToken;
            const resolved = await (v as any);
            if (freshnessToken === token && !context.cancellationToken.isCancelled) {
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
    });
}

/**
 * Reduces all updates down to a value
 */
export function dsReduce<T, M = T>(reducer: (p: M, c: T) => M, initialValue: M): DataSourceMapOperator<T, M> {
    return perPipeline(() => {
        let last = initialValue;
        return {
        name: 'reduce',
        operationType: OperationType.MAP,
        operation: (v) => {
            last = reducer(last, v);
            return last;
        }
        };
    });
}

/**
 * Builds a string where each update is appened to the string optionally with a seperator
 */
export function dsStringJoin(separator: string = ', '): DataSourceMapOperator<string, string> {
    return perPipeline(() => {
        let last: string;
        let primed = false;
        return {
        name: `stringJoin ${separator}`,
        operationType: OperationType.MAP,
        operation: (v: string) => {
            if (primed) {
                last += separator + v;
            } else {
                last = v;
                primed = true;
            }
            return last;
        }
        };
    });
}

/**
 * Adds a fixed amount of lag to updates
 */
export function dsDelay<T>(time: number): DataSourceDelayOperator<T> {
    requireNonNegative(time, 'time');
    return perPipeline((context) => ({
        name: `delay ${time}ms`,
        operationType: OperationType.DELAY,
        operation: (v) => {
            return new Promise((resolve) => {
                let settled = false;
                const finish = () => {
                    if (!settled) {
                        settled = true;
                        resolve(v);
                    }
                };
                const timeout = setTimeout(() => {
                    if (!context.cancellationToken.isCancelled) context.cancellationToken.removeCancellable(cancel);
                    finish();
                }, time);
                const cancel = () => {
                    clearTimeout(timeout);
                    finish();
                };
                context.cancellationToken.addCancellable(cancel);
            });
        }
    }));
}

/**
 * Starts a timer when an update occurs, delays the update until the timer passed if a new update arrives the initial
 * update is cancelled and the process starts again
 */
export function dsDebounce<T>(time: number): DataSourceDelayFilterOperator<T> {
    requireNonNegative(time, 'time');
    return perPipeline((context) => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let pending: ((accepted: boolean) => void) | undefined;
        context.cancellationToken.addCancellable(() => {
            clearTimeout(timeout);
            pending?.(false);
            pending = undefined;
        });
        return {
        operationType: OperationType.DELAY_FILTER,
        name: `debounce ${time}ms`,
        operation: (v) => {
            return new Promise((resolve) => {
                clearTimeout(timeout);
                pending?.(false);
                pending = resolve;
                timeout = setTimeout(() => {
                    pending = undefined;
                    resolve(true);
                }, time);
            });
        }
        };
    });
}

/**
 * Only allow up to 1 update to propagate per frame makes update run as a microtask
 */
export function dsMicroDebounce<T>(): DataSourceDelayFilterOperator<T> {
    return perPipeline((context) => {
        let scheduled = false;
        return {
        operationType: OperationType.DELAY_FILTER,
        name: `microDebounce`,
        operation: (v) => {
            return new Promise((resolve) => {
                if (!scheduled) {
                    scheduled = true;
                    queueMicrotask(() => {
                        scheduled = false;
                        resolve(!context.cancellationToken.isCancelled);
                    });
                } else {
                    resolve(false);
                }
            });
        }
        };
    });
}

/**
 * Debounce update to occur at most one per animation frame
 */
export function dsThrottleFrame<T>(): DataSourceDelayFilterOperator<T> {
    return perPipeline((context) => {
        let timeout: number | ReturnType<typeof setTimeout> | undefined;
        let pending: ((accepted: boolean) => void) | undefined;
        const cancelFrame = (id: number | ReturnType<typeof setTimeout>) => {
            if (typeof globalThis.cancelAnimationFrame === 'function') globalThis.cancelAnimationFrame(id as number);
            else clearTimeout(id);
        };
        const scheduleFrame = (callback: () => void): number | ReturnType<typeof setTimeout> => {
            if (typeof globalThis.requestAnimationFrame === 'function') return globalThis.requestAnimationFrame(callback);
            return setTimeout(callback, 16);
        };
        context.cancellationToken.addCancellable(() => {
            if (timeout !== undefined) cancelFrame(timeout);
            pending?.(false);
            pending = undefined;
        });
        return {
        operationType: OperationType.DELAY_FILTER,
        name: `throttle frame`,
        operation: (v) => {
            return new Promise((resolve) => {
                if (timeout !== undefined) cancelFrame(timeout);
                pending?.(false);
                pending = resolve;
                timeout = scheduleFrame(() => {
                    pending = undefined;
                    resolve(true);
                });
            });
        }
        };
    });
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
    requireNonNegative(time, 'time');
    return perPipeline(() => {
        let lastCall: number | undefined;
        return {
        name: `throttle ${time}ms`,
        operationType: OperationType.FILTER,
        operation: (v) => {
            const now = performance.now();
            if (lastCall === undefined || now - lastCall >= time) {
                lastCall = now;
                return true;
            } else {
                return false;
            }
        }
        };
    });
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
        maxBufferSize?: number;
    }
): DataSourceDelayFilterOperator<T> {
    requireNonNegative(time, 'time');
    if (options?.maxBufferSize !== undefined) requireNonNegative(options.maxBufferSize, 'maxBufferSize');
    if (options?.highWaterMark !== undefined) requireNonNegative(options.highWaterMark, 'highWaterMark');
    return perPipeline((context) => {
    let lastCall: number | undefined;
    const buffer: Array<(result: boolean) => void> = [];
    let timeout: ReturnType<typeof setTimeout> | undefined;

    function next() {
        timeout = undefined;
        if (context.cancellationToken.isCancelled) return;
        const now = performance.now();
        if (buffer.length > 0 && (lastCall === undefined || now - lastCall >= time)) {
            const resolve = buffer.shift();
            lastCall = now;
            resolve(true);
        }
        if (buffer.length > 0) {
            timeout = setTimeout(next, Math.max(0, time - (performance.now() - (lastCall ?? 0))));
        }
    }

    context.cancellationToken.addCancellable(() => {
        clearTimeout(timeout);
        for (const resolve of buffer.splice(0)) resolve(false);
    });
    return {
        name: `throttle buffer ${time}ms`,
        operationType: OperationType.DELAY_FILTER,
        operation: async (v) => {
            const now = performance.now();
            if (buffer.length === 0 && (lastCall === undefined || now - lastCall >= time)) {
                lastCall = now;
                return true;
            } else {
                if (options?.maxBufferSize !== undefined && buffer.length >= options.maxBufferSize) {
                    return false;
                }

                let res!: (result: boolean) => void;
                const promise = new Promise<boolean>((resolve) => {
                    res = resolve;
                });

                buffer.push(res);

                if (options?.highWaterMark && buffer.length >= options.highWaterMark) {
                    options.onHighWaterMark?.();
                }

                if (timeout === undefined) {
                    next();
                }
                return promise;
            }
        }
    };
    });
}

export function dsSpread<T>(): DataSourceSpreadOperator<T[], T> {
    return {
        name: 'spread',
        operationType: OperationType.SPREAD,
        operation: (v) => {
            return v;
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
    if (!config || (config.time === undefined && config.maxBatchSize === undefined && !config.canBatch)) {
        throw new Error('At least one of time, maxBatchSize or batchPredicate must be provided');
    }
    if (config.time !== undefined) requireNonNegative(config.time, 'time');
    if (config.maxBatchSize !== undefined) {
        if (!Number.isInteger(config.maxBatchSize) || config.maxBatchSize <= 0) throw new RangeError('maxBatchSize must be a positive integer');
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
    return perPipeline((context) => {
        let buffer: T[] = [];
        let resolveBatch: ((value: { item: T[]; cancelled: boolean }) => void) | undefined;
        let batchPromise: Promise<{ item: T[]; cancelled: boolean }> | undefined;
        let timeout: ReturnType<typeof setTimeout> | undefined;

        context.cancellationToken.addCancellable(() => flush(true));

        return {
        name,
        operationType: OperationType.MAP_DELAY_FILTER,
        operation: (v) => {
            if (canBatch && buffer.length > 0 && !canBatch(v, buffer)) {
                flush(false);
            }

            const isNewBatch = batchPromise === undefined;
            if (isNewBatch) startBatch();
            const currentPromise = batchPromise;
            buffer.push(v);

            if (maxBatchSize && buffer.length >= maxBatchSize) {
                flush(false);
            }

            // The update is suspended until the batch is resolved
            if (isNewBatch) {
                return currentPromise;
            } else {
                // Updates coming in while the batch is being processed are added to the batch and cancelled from the stream
                return Promise.resolve({
                    cancelled: true,
                    item: undefined
                });
            }

        }
        };

        function startBatch(): void {
            batchPromise = new Promise((resolve) => {
                resolveBatch = resolve;
            });
            if (time !== undefined) timeout = setTimeout(() => flush(false), time);
        }

        function flush(cancelled: boolean): void {
            if (!batchPromise) return;
            clearTimeout(timeout);
            timeout = undefined;
            const items = buffer;
            const resolve = resolveBatch;
            buffer = [];
            batchPromise = undefined;
            resolveBatch = undefined;
            resolve?.({ cancelled, item: items });
        }
    });
}

/**
 * Extracts only the value of a key of the update value
 */
export function dsPick<T, K extends keyof NonNullable<T>>(key: K): DataSourceMapOperator<T, NonNullable<T>[K] | Extract<T, null | undefined>> {
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
export function dsPipe<T>(target: DataPublisher<T> & { readonly name: string }): DataSourceNoopOperator<T> {
    return {
        name: `pipe ${target.name}`,
        operationType: OperationType.NOOP,
        operation: (v) => {
            target.publish(v);
        }
    };
}

/**
 * Same as pipe except for duplex data sources it pipes upstream
 */
export function dsPipeUp<T>(target: DataWriter<T> & { readonly name: string }): DataSourceNoopOperator<T> {
    return {
        name: `pipeup ${target.name}`,
        operationType: OperationType.NOOP,
        operation: (v) => {
            target.write(v);
        }
    };
}

/**
 * Lets you keep a history of the updates of a source by pushing it onto an array datasource
 */
export function dsHistory<T>(
    reportTarget: ArrayDataSource<T>,
    generations?: number,
    cancellationToken?: CancellationToken
): DataSourceNoopOperator<T> {
    if (generations !== undefined && (!Number.isInteger(generations) || generations < 0)) {
        throw new RangeError('generations must be a non-negative integer');
    }
    return perPipeline((context) => ({
        operationType: OperationType.NOOP,
        name: `history`,
        operation: (v) => {
            if (!context.cancellationToken.isCancelled && !cancellationToken?.isCancelled) {
                if (generations === 0) return;
                if (generations !== undefined) {
                    if (reportTarget.length.value >= generations) {
                        reportTarget.removeLeft(reportTarget.length.value - generations + 1);
                    }
                }
                reportTarget.push(v);
            }
        }
    }));
}

/**
 * Monitors the number of events per interval
 */
export function dsThroughputMeter<T>(
    reportTarget: DataSource<number>,
    interval: number,
    cancellationToken?: CancellationToken
): DataSourceNoopOperator<T> {
    requireNonNegative(interval, 'interval');
    return perPipeline((context) => {
        let amount = 0;
        const lifetime = cancellationToken ? context.cancellationToken.or(cancellationToken) : context.cancellationToken;
        if (!lifetime.isCancelled) {
            lifetime.setInterval(() => {
                reportTarget.update(amount);
                amount = 0;
            }, interval);
        }
        return {
        operationType: OperationType.NOOP,
        name: `throughput meter`,
        operation: (v) => {
            if (!lifetime.isCancelled) amount++;
        }
        };
    });
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
export function dsLoadBalance<T>(targets: Array<DataPublisher<T> & { readonly name: string }>): DataSourceNoopOperator<T> {
    if (targets.length === 0) throw new Error('dsLoadBalance requires at least one target');
    return perPipeline(() => {
        let i = 0;
        return {
        name: `loadBalance [${targets.map((v) => v.name).join()}]`,
        operationType: OperationType.NOOP,
        operation: (v) => {
            const target = targets[i++];
            if (i >= targets.length) {
                i = 0;
            }
            target.publish(v);
        }
        };
    });
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

export function dsPipeAll<T>(...sources: Array<DataPublisher<T> & { readonly name: string }>): DataSourceNoopOperator<T> {
    return {
        name: `pipeAll [${sources.map((v) => v.name).join()}]`,
        operationType: OperationType.NOOP,
        operation: (v) => {
            sources.forEach((source) => {
                source.publish(v);
            });
        }
    };
}

export function dsAccumulate(initialValue: number): DataSourceMapOperator<number, number> {
    return perPipeline(() => {
        let sum = initialValue;
        return {
        name: `accumulate`,
        operationType: OperationType.MAP,
        operation: (v) => {
            sum += v;
            return sum;
        }
        };
    });
}

/** Familiar aliases; the ds-prefixed names remain supported. */
export const dsDistinct = dsUnique;
export const dsScan = dsReduce;
export const dsTake = dsCutOff;
export const dsRecordLow = dsMin;
export const dsRecordHigh = dsMax;
export const dsMicroThrottle = dsMicroDebounce;
export const dsDebounceFrame = dsThrottleFrame;
