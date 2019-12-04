import { DataSource } from './data_source';
import { Callback } from '../utilities/common';
import { CancellationToken } from '../utilities/cancellation_token';

export interface ObjectChange<T, K extends keyof T> {
	key: K;
	oldValue: T[K];
	newValue: T[K];
}

export class ObjectDataSource<T> {
	protected data: T;
	private listeners: Callback<ObjectChange<T, keyof T>>[];
	private listenersOnKey: Map<keyof T, Callback<ObjectChange<T, keyof T>>[]>;

	constructor(initialData: T) {
		if (initialData) {
			this.data = initialData;
		}

		this.listeners = [];
		this.listenersOnKey = new Map();
	}

	public pick(key: keyof T, cancellationToken?: CancellationToken): DataSource<T[typeof key]> {
		const subDataSource: DataSource<T[typeof key]> = new DataSource(this.data?.[key]);

		this.listenOnKey(
			key,
			(v) => {
				subDataSource.update(v.newValue);
			},
			cancellationToken
		);

		return subDataSource;
	}

	public listen(callback: Callback<ObjectChange<T, keyof T>>, cancellationToken?: CancellationToken): Callback<void> {
		this.listeners.push(callback);
		const cancel = () => {
			const index = this.listeners.indexOf(callback);
			if (index !== -1) {
				this.listeners.splice(index, 1);
			}
		};
		cancellationToken?.addCancelable(() => {
			cancel();
		});
		return cancel;
	}

	/**
	 * Same as listenOnKey but will immediately call the callback with the current value first
	 */
	public listenOnKeyAndRepeat<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, K>>, cancellationToken?: CancellationToken): Callback<void> {
		callback({
			key,
			newValue: this.data[key],
			oldValue: undefined
		});

		return this.listenOnKey(key, callback, cancellationToken);
	}

	public listenOnKey<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, K>>, cancellationToken?: CancellationToken): Callback<void> {
		if (!this.listenersOnKey.has(key)) {
			this.listenersOnKey.set(key, []);
		}
		const listeners = this.listenersOnKey.get(key);
		listeners.push(callback);
		const cancel = () => {
			const index = listeners.indexOf(callback);
			if (index !== -1) {
				listeners.splice(index, 1);
			}
		};
		cancellationToken?.addCancelable(() => {
			cancel();
		});
		return cancel;
	}

	public get<K extends keyof T>(key: K): T[K] {
		return this.data[key];
	}

	public set<K extends keyof T>(key: K, value: T[K]): void {
		if (this.data[key] === value) {
			return;
		}

		const old = this.data[key];
		this.data[key] = value;
		for (const l of this.listeners) {
			l({ oldValue: old, key, newValue: this.data[key] });
		}
		if (this.listenersOnKey.has(key)) {
			for (const l of this.listenersOnKey.get(key)) {
				l({ oldValue: old, key, newValue: this.data[key] });
			}
		}
	}

	public assign(newData: Partial<T>): void {
		for (const key of Object.keys(newData)) {
			this.set(key as keyof T, newData[key]);
		}
	}

	public toObject(): T {
		return { ...this.data };
	}

	public toDataSource(): DataSource<T> {
		const stream = new DataSource(this.data);
		this.listen((s) => {
			stream.update(this.data);
		});
		return stream;
	}
}
