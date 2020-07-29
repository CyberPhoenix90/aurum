import { ThenArg, Callback } from '../utilities/common';
import { EventEmitter } from '../utilities/event_emitter';
import { DataSource } from './data_source';
import { DuplexDataSource } from './duplex_data_source';
import { Stream } from './stream';

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
	operation: (value: T) => Promise<{ item: T; cancelled: boolean }>;
}

export function dsMap<T, M>(mapper: (value: T) => M): DataSourceMapOperator<T, M> {
	return {
		operationType: OperationType.MAP,
		operation: (v) => mapper(v)
	};
}

export function dsDiff<T>(): DataSourceMapOperator<T, { newValue: T; oldValue: T }> {
	let lastValue = undefined;
	return {
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
		operationType: OperationType.FILTER,
		operation: (v) => predicate(v)
	};
}

export function dsEven(): DataSourceFilterOperator<number> {
	return {
		operationType: OperationType.FILTER,
		operation: (v) => v % 2 === 0
	};
}

export function dsOdd(): DataSourceFilterOperator<number> {
	return {
		operationType: OperationType.FILTER,
		operation: (v) => v % 2 !== 0
	};
}

export function dsSkip<T>(amount: number): DataSourceFilterOperator<T> {
	return {
		operationType: OperationType.FILTER,
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

export function cutOff<T>(amount: number): DataSourceFilterOperator<T> {
	return {
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

export function dsUnique<T>(): DataSourceFilterOperator<T> {
	let last: T;
	return {
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
		operation: (v) => {
			return new Promise((resolve) => {
				clearTimeout(timeout);
				cancelled.fire();
				cancelled.subscribeOnce(() => {
					resolve({
						item: undefined,
						cancelled: true
					});
				});
				timeout = setTimeout(() => {
					resolve({
						cancelled: false,
						item: v
					});
				}, time);
			});
		}
	};
}

export function dsThrottle<T>(time: number): DataSourceFilterOperator<T> {
	let cooldown = false;
	return {
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

new DataSource('est').transform(dsMap(parseInt), dsOdd());
