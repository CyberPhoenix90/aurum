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

export function dsMap<T, M>(mapper: (value: T) => M): DataSourceMapOperator<T, M> {
	return {
		name: 'map',
		operationType: OperationType.MAP,
		operation: (v) => mapper(v)
	};
}

export function dsMapAsync<T, M>(mapper: (value: T) => Promise<M>): DataSourceMapDelayOperator<T, M> {
	return {
		name: 'mapAsync',
		operationType: OperationType.MAP_DELAY,
		operation: (v) => mapper(v)
	};
}

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

export function dsFilter<T>(predicate: (value: T) => boolean): DataSourceFilterOperator<T> {
	return {
		name: 'filter',
		operationType: OperationType.FILTER,
		operation: (v) => predicate(v)
	};
}

export function dsFilterAsync<T>(predicate: (value: T) => Promise<boolean>): DataSourceDelayFilterOperator<T> {
	return {
		name: 'filterAsync',
		operationType: OperationType.DELAY_FILTER,
		operation: (v) => predicate(v)
	};
}

export function dsEven(): DataSourceFilterOperator<number> {
	return {
		name: 'even',
		operationType: OperationType.FILTER,
		operation: (v) => v % 2 === 0
	};
}

export function dsOdd(): DataSourceFilterOperator<number> {
	return {
		name: 'odd',
		operationType: OperationType.FILTER,
		operation: (v) => v % 2 !== 0
	};
}

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

export function dsUnique<T>(): DataSourceFilterOperator<T> {
	let last: T;
	return {
		name: 'unique',
		operationType: OperationType.FILTER,
		operation: (v) => {
			if (v === last) {
				return false;
			} else {
				last = v;
				return true;
			}
		}
	};
}

export function dsAwait<T>(): DataSourceMapDelayOperator<T, ThenArg<T>> {
	return {
		name: 'await',
		operationType: OperationType.MAP_DELAY,
		operation: (v) => {
			return v as any;
		}
	};
}

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
					resolve(true);
				});
				timeout = setTimeout(() => {
					resolve(false);
				}, time);
			});
		}
	};
}

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

export function dsBuffer<T>(time: number): DataSourceMapDelayOperator<T, T[]> {
	let buffer = [];
	let promise;

	return {
		name: `buffer ${time}ms`,
		operationType: OperationType.MAP_DELAY,
		operation: (v) => {
			buffer.push(v);
			if (!promise) {
				promise = new Promise((resolve) => {
					setTimeout(() => {
						promise = undefined;
						resolve(buffer);
						buffer = [];
					}, time);
				});
			}

			return promise;
		}
	};
}

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
