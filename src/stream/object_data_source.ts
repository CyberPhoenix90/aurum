import { DataSource } from './data_source';
import { Callback } from '../utilities/common';
import { CancellationToken } from '../utilities/cancellation_token';
import { EventEmitter } from '../utilities/event_emitter';

export interface ObjectChange<T, K extends keyof T> {
	key: K;
	oldValue: T[K];
	newValue: T[K];
}

export class ObjectDataSource<T> {
	protected data: T;
	private updateEvent: EventEmitter<ObjectChange<T, keyof T>>;
	private updateEventOnKey: Map<keyof T, EventEmitter<ObjectChange<T, keyof T>>>;

	constructor(initialData: T) {
		if (initialData) {
			this.data = initialData;
		}

		this.updateEvent = new EventEmitter();
		this.updateEventOnKey = new Map();
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
		return this.updateEvent.subscribe(callback, cancellationToken).cancel;
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
		if (!this.updateEventOnKey.has(key)) {
			this.updateEventOnKey.set(key, new EventEmitter());
		}
		const event = this.updateEventOnKey.get(key);
		return event.subscribe(callback, cancellationToken).cancel;
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
		this.updateEvent.fire({ oldValue: old, key, newValue: this.data[key] });
		if (this.updateEventOnKey.has(key)) {
			this.updateEventOnKey.get(key).fire({ oldValue: old, key, newValue: this.data[key] });
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
