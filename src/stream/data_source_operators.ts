import { ThenArg, Callback } from '../utilities/common';
import { EventEmitter } from '../utilities/event_emitter';
import { DataSource } from './data_source';
import { DuplexDataSource } from './duplex_data_source';
import { Stream } from './stream';
import {
	DataSourceMapOperator,
	OperationType,
	DataSourceFilterOperator,
	DataSourceMapDelayOperator,
	DataSourceMapDelayFilterOperator,
	DataSourceDelayOperator,
	DataSourceDelayFilterOperator,
	DataSourceNoopOperator
} from './operator_model';

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
export function dsFork<T>(condition: (value: T) => boolean, truthyPath: DataSource<T>, falsyPath: DataSource<T>): DataSourceNoopOperator<T> {
	return {
		name: 'fork',
		operationType: OperationType.NOOP,
		operation: (v) => {
			if (condition(v)) {
				truthyPath.update(v);
			} else {
				falsyPath.update(v);
			}
			return v;
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
	let last: T;
	return {
		name: 'unique',
		operationType: OperationType.FILTER,
		operation: (v) => {
			if (isEqual ? isEqual(last, v) : v === last) {
				return false;
			} else {
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
 * When unblocked the last value that was blocked is passed through
 * lock state
 * true => updates pass through
 * false => latest update state is buffered and passes once unlocked
 */
export function dsLock<T>(state: DataSource<boolean>): DataSourceDelayOperator<T> {
	return {
		name: 'lock',
		operationType: OperationType.DELAY,
		operation: (v) => {
			return new Promise((resolve) => {
				if (state.value) {
					resolve(v);
				} else {
					const cancel = state.listen(() => {
						if (state.value) {
							cancel();
							resolve(v);
						}
					});
				}
			});
		}
	};
}

/**
 * Allows at most one update per N milliseconds to pass through
 */
export function dsThrottle<T>(time: number): DataSourceFilterOperator<T> {
	let cooldown = false;
	return {
		name: `throttle ${time}ms`,
		operationType: OperationType.FILTER,
		operation: (v) => {
			if (!cooldown) {
				cooldown = true;
				setTimeout(() => {
					cooldown = false;
				}, time);
				return true;
			} else {
				return false;
			}
		}
	};
}

/**
 * When an update occurs a timer is started, during that time all subsequent updates are collected in an array and then
 * once the timer runs out an update is made with all updates collected so far as an array
 */
export function dsBuffer<T>(time: number): DataSourceMapDelayFilterOperator<T, T[]> {
	let buffer = [];
	let promise;

	return {
		name: `buffer ${time}ms`,
		operationType: OperationType.MAP_DELAY_FILTER,
		operation: (v) => {
			buffer.push(v);
			if (!promise) {
				promise = new Promise((resolve) => {
					setTimeout(() => {
						promise = undefined;
						resolve({
							cancelled: false,
							item: buffer
						});
						buffer = [];
					}, time);
				});
				return promise;
			} else {
				return Promise.resolve({
					cancelled: true,
					item: undefined
				});
			}
		}
	};
}

/**
 * Extracts only the value of a key of the update value
 */
export function dsPick<T, K extends keyof T>(key: K): DataSourceMapOperator<T, T[K]> {
	return {
		name: `pick ${key}`,
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
			return v;
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
			return v;
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
			return v;
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

			return v;
		}
	};
}
