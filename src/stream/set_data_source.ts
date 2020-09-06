import { ArrayDataSource, DataSource } from './data_source';
import { Callback } from '../utilities/common';
import { CancellationToken } from '../utilities/cancellation_token';
import { EventEmitter } from '../utilities/event_emitter';

export interface SetChange<K> {
	key: K;
	exists: boolean;
}

export class SetDataSource<K> {
	protected data: Set<K>;
	private updateEvent: EventEmitter<SetChange<K>>;
	private updateEventOnKey: Map<K, EventEmitter<boolean>>;

	constructor(initialData: Set<K>) {
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
	public pick(key: K, cancellationToken?: CancellationToken): DataSource<boolean> {
		const subDataSource: DataSource<boolean> = new DataSource(this.data.has(key));

		this.listenOnKey(
			key,
			(v) => {
				subDataSource.update(v);
			},
			cancellationToken
		);

		return subDataSource;
	}

	/**
	 * Listen to changes of the object
	 */
	public listen(callback: Callback<SetChange<K>>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateEvent.subscribe(callback, cancellationToken).cancel;
	}

	/**
	 * Same as listen but will immediately call the callback with the current value of each key
	 */
	public listenAndRepeat(callback: Callback<SetChange<K>>, cancellationToken?: CancellationToken): Callback<void> {
		const c = this.updateEvent.subscribe(callback, cancellationToken).cancel;
		for (const key of this.data.keys()) {
			callback({
				key,
				exists: true
			});
		}
		return c;
	}

	/**
	 * Same as listenOnKey but will immediately call the callback with the current value first
	 */
	public listenOnKeyAndRepeat(key: K, callback: Callback<boolean>, cancellationToken?: CancellationToken): Callback<void> {
		callback(this.has(key));

		return this.listenOnKey(key, callback, cancellationToken);
	}

	/**
	 * Listen to changes of a single key of the object
	 */
	public listenOnKey(key: K, callback: Callback<boolean>, cancellationToken?: CancellationToken): Callback<void> {
		if (!this.updateEventOnKey.has(key)) {
			this.updateEventOnKey.set(key, new EventEmitter());
		}
		const event = this.updateEventOnKey.get(key);
		return event.subscribe(callback, cancellationToken).cancel;
	}

	public map<D>(mapper: (change: SetChange<K>) => D): ArrayDataSource<D> {
		const stateMap: Map<K, D> = new Map<K, D>();
		const result = new ArrayDataSource<D>();
		this.listenAndRepeat((change) => {
			if (!change.exists && stateMap.has(change.key)) {
				const item = stateMap.get(change.key);
				result.remove(item);
				stateMap.delete(change.key);
			} else if (!stateMap.has(change.key) && change.exists) {
				const newItem = mapper(change);
				result.push(newItem);
				stateMap.set(change.key, newItem);
			}
		});

		return result;
	}

	/**
	 * Returns all the keys of the object in the source
	 */
	public keys(): IterableIterator<K> {
		return this.data.keys();
	}

	/**
	 * check if map has a key
	 * @param key
	 */
	public has(key: K): boolean {
		return this.data.has(key);
	}

	/**
	 * delete a key from the object
	 * @param key
	 * @param value
	 */
	public delete(key: K): void {
		this.data.delete(key);
		this.updateEvent.fire({ key, exists: false });
		if (this.updateEventOnKey.has(key)) {
			this.updateEventOnKey.get(key).fire(false);
		}
	}

	/**
	 * set the value for a key of the object
	 * @param key
	 * @param value
	 */
	public add(key: K): void {
		if (this.data.has(key)) {
			return;
		}
		this.data.add(key);
		this.updateEvent.fire({ key, exists: true });
		if (this.updateEventOnKey.has(key)) {
			this.updateEventOnKey.get(key).fire(true);
		}
	}

	/**
	 * Merge the key value pairs of an object into this object non recursively
	 * @param newData
	 */
	public assign(newData: Set<K> | SetDataSource<K>): void {
		for (const key of newData.keys()) {
			this.add(key);
		}
	}

	/**
	 * Returns a shallow copy of the set
	 */
	public toSet(): Set<K> {
		return new Set(this.data.keys());
	}
}
