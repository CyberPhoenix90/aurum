import { ArrayDataSource, DataSource } from './data_source';
import { Callback } from '../utilities/common';
import { CancellationToken } from '../utilities/cancellation_token';
import { EventEmitter } from '../utilities/event_emitter';

export interface MapChange<K, V> {
	key: K;
	oldValue: V;
	newValue: V;
	deleted?: boolean;
}

export class MapDataSource<K, V> {
	protected data: Map<K, V>;
	private updateEvent: EventEmitter<MapChange<K, V>>;
	private updateEventOnKey: Map<K, EventEmitter<MapChange<K, V>>>;

	constructor(initialData?: Map<K, V>) {
		this.data = initialData ?? new Map();

		this.updateEvent = new EventEmitter();
		this.updateEventOnKey = new Map();
	}

	/**
	 * Creates a datasource for a single key of the object
	 * @param key
	 * @param cancellationToken
	 */
	public pick(key: K, cancellationToken?: CancellationToken): DataSource<V> {
		const subDataSource: DataSource<V> = new DataSource(this.data.get(key));

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
	public listen(callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateEvent.subscribe(callback, cancellationToken).cancel;
	}

	/**
	 * Same as listen but will immediately call the callback with the current value of each key
	 */
	public listenAndRepeat(callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): Callback<void> {
		const c = this.updateEvent.subscribe(callback, cancellationToken).cancel;
		for (const key of this.data.keys()) {
			callback({
				key,
				newValue: this.data.get(key),
				oldValue: undefined,
				deleted: false
			});
		}
		return c;
	}

	public map<D>(mapper: (key: K) => D): ArrayDataSource<D> {
		const stateMap: Map<K, D> = new Map<K, D>();
		const result = new ArrayDataSource<D>();
		this.listenAndRepeat((change) => {
			if (change.deleted && stateMap.has(change.key)) {
				const item = stateMap.get(change.key);
				result.remove(item);
				stateMap.delete(change.key);
			} else if (stateMap.has(change.key)) {
				const newItem = mapper(change.key);
				result.replace(stateMap.get(change.key), newItem);
				stateMap.set(change.key, newItem);
			} else if (!stateMap.has(change.key) && !change.deleted) {
				const newItem = mapper(change.key);
				result.push(newItem);
				stateMap.set(change.key, newItem);
			}
		});

		return result;
	}

	/**
	 * Same as listenOnKey but will immediately call the callback with the current value first
	 */
	public listenOnKeyAndRepeat(key: K, callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): Callback<void> {
		callback({
			key,
			newValue: this.data.get(key),
			oldValue: undefined
		});

		return this.listenOnKey(key, callback, cancellationToken);
	}

	/**
	 * Listen to changes of a single key of the object
	 */
	public listenOnKey(key: K, callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): Callback<void> {
		if (!this.updateEventOnKey.has(key)) {
			this.updateEventOnKey.set(key, new EventEmitter());
		}
		const event = this.updateEventOnKey.get(key);
		return event.subscribe(callback, cancellationToken).cancel;
	}

	/**
	 * Returns all the keys of the object in the source
	 */
	public keys(): IterableIterator<K> {
		return this.data.keys();
	}

	/**
	 * Returns all the values of the object in the source
	 */
	public values(): IterableIterator<V> {
		return this.data.values();
	}

	/**
	 * get the current value of a key of the object
	 * @param key
	 */
	public get(key: K): V {
		return this.data.get(key);
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
		const old = this.data.get(key);
		this.data.delete(key);
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
	public set(key: K, value: V): void {
		if (this.data.get(key) === value) {
			return;
		}

		const old = this.data.get(key);
		this.data.set(key, value);
		this.updateEvent.fire({ oldValue: old, key, newValue: this.data.get(key) });
		if (this.updateEventOnKey.has(key)) {
			this.updateEventOnKey.get(key).fire({ oldValue: old, key, newValue: this.data.get(key) });
		}
	}

	/**
	 * Merge the key value pairs of an object into this object non recursively
	 * @param newData
	 */
	public assign(newData: Map<K, V> | MapDataSource<K, V>): void {
		for (const key of newData.keys()) {
			this.set(key, newData.get(key));
		}
	}

	/**
	 * Returns a shallow copy of the map
	 */
	public toMap(): Map<K, V> {
		return new Map(this.data.entries());
	}
}
