import { DataSource } from './data_source';
import { Callback } from '../utilities/common';
import { CancellationToken } from '../utilities/cancellation_token';
import { EventEmitter } from '../utilities/event_emitter';

export interface ObjectChange<T, K extends keyof T> {
	key: K;
	oldValue: T[K];
	newValue: T[K];
	deleted?: boolean;
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

	/**
	 * Creates a datasource for a single key of the object
	 * @param key
	 * @param cancellationToken
	 */
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

	/**
	 * Listen to changes of the object
	 */
	public listen(callback: Callback<ObjectChange<T, keyof T>>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateEvent.subscribe(callback, cancellationToken).cancel;
	}

	/**
	 * Same as listenOnKey but will immediately call the callback with the current value first
	 */
	public listenOnKeyAndRepeat<K extends keyof T>(
		key: K,
		callback: Callback<ObjectChange<T, keyof T>>,
		cancellationToken?: CancellationToken
	): Callback<void> {
		callback({
			key,
			newValue: this.data[key],
			oldValue: undefined
		});

		return this.listenOnKey(key, callback, cancellationToken);
	}

	/**
	 * Listen to changes of a single key of the object
	 */
	public listenOnKey<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, keyof T>>, cancellationToken?: CancellationToken): Callback<void> {
		if (!this.updateEventOnKey.has(key)) {
			this.updateEventOnKey.set(key, new EventEmitter());
		}
		const event = this.updateEventOnKey.get(key);
		return event.subscribe(callback, cancellationToken).cancel;
	}

	/**
	 * Returns all the keys of the object in the source
	 */
	public keys(): string[] {
		return Object.keys(this.data);
	}

	/**
	 * Returns all the values of the object in the source
	 */
	public values(): any {
		return Object.values(this.data);
	}

	/**
	 * get the current value of a key of the object
	 * @param key
	 */
	public get<K extends keyof T>(key: K): T[K] {
		return this.data[key];
	}

	/**
	 * delete a key from the object
	 * @param key
	 * @param value
	 */
	public delete<K extends keyof T>(key: K): void {
		const old = this.data[key];
		delete this.data[key];
		this.updateEvent.fire({ oldValue: old, key, newValue: undefined, deleted: true });
		if (this.updateEventOnKey.has(key)) {
			this.updateEventOnKey.get(key).fire({ oldValue: old, key, newValue: undefined });
		}
	}

	/**
	 * set the value for a key of the object
	 * @param key
	 * @param value
	 */
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

	/**
	 * Merge the key value pairs of an object into this object non recursively
	 * @param newData
	 */
	public assign(newData: Partial<T> | ObjectDataSource<T>): void {
		if (newData instanceof ObjectDataSource) {
			for (const key of newData.keys()) {
				this.set(key as keyof T, newData.data[key]);
			}
		} else {
			for (const key of Object.keys(newData)) {
				this.set(key as keyof T, newData[key]);
			}
		}
	}

	/**
	 * Returns a shallow copy of the object
	 */
	public toObject(): T {
		return { ...this.data };
	}

	/**
	 * Returns a simplified version of this datasource
	 */
	public toDataSource(): DataSource<T> {
		const stream = new DataSource(this.data);
		this.listen((s) => {
			stream.update(this.data);
		});
		return stream;
	}
}
