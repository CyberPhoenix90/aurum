import { CancellationToken } from '../utilities/cancellation_token';
import { Callback, Predicate } from '../utilities/common';
import { EventEmitter } from '../utilities/event_emitter';

export class DataSource<T> {
	public value: T;
	private updating: boolean;
	private updateEvent: EventEmitter<T>;

	constructor(initialValue?: T) {
		this.value = initialValue;
		this.updateEvent = new EventEmitter();
	}

	/**
	 * Updates the value in the data source and calls the listen callback for all listeners
	 * @param newValue new value for the data source
	 */
	public update(newValue: T): void {
		if (this.updating) {
			throw new Error(
				'Problem in datas source: Unstable value propagation, when updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed'
			);
		}
		this.updating = true;
		this.value = newValue;
		this.updateEvent.fire(newValue);
		this.updating = false;
	}

	/**
	 * Similar to update but does not update the the sender to avoid infinite mutual updates
	 * @param sender Source of the backpropagation
	 * @param newValue
	 */
	protected backPropagate(sender: Callback<T>, newValue: T): void {
		this.value = newValue;
		this.updating = true;
		this.updateEvent.fireFiltered(newValue, sender);
		this.updating = false;
	}

	/**
	 * Same as listen but will immediately call the callback with the current value first
	 * @param callback Callback to call when value is updated
	 * @param cancellationToken Optional token to control the cancellation of the subscription
	 * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
	 */
	public listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		callback(this.value);
		return this.listen(callback, cancellationToken);
	}

	/**
	 * Subscribes to the updates of the data stream
	 * @param callback Callback to call when value is updated
	 * @param cancellationToken Optional token to control the cancellation of the subscription
	 * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
	 */
	public listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateEvent.subscribe(callback, cancellationToken).cancel;
	}

	public filter(callback: (value: T) => boolean, cancellationToken?: CancellationToken): DataSource<T> {
		const filteredSource = new DataSource<T>();
		this.listen((value) => {
			if (callback(value)) {
				filteredSource.update(value);
			}
		}, cancellationToken);
		return filteredSource;
	}

	/**
	 *
	 * @param callback
	 * @param cancellationToken
	 */
	public filterDuplex(callback: (value: T) => boolean, cancellationToken?: CancellationToken): DataSource<T> {
		const filteredSource = new DataSource<T>();
		const cb = (value) => {
			if (callback(value)) {
				filteredSource.backPropagate(cb2, value);
			}
		};
		const cb2 = (value) => {
			if (callback(value)) {
				this.backPropagate(cb, value);
			}
		};

		this.listen(cb, cancellationToken);
		filteredSource.listen(cb2, cancellationToken);
		return filteredSource;
	}

	public pipe(targetDataSource: DataSource<T>, cancellationToken?: CancellationToken): void {
		this.listen((v) => targetDataSource.update(v), cancellationToken);
	}

	/**
	 * Duplex pipe is like pipe except that it binds both ways
	 * @param targetDataSource
	 * @param cancellationToken
	 */
	public pipeDuplex(targetDataSource: DataSource<T>, cancellationToken?: CancellationToken): void {
		const cb = (v) => targetDataSource.backPropagate(cb2, v);
		const cb2 = (v) => this.backPropagate(cb, v);

		this.listen(cb, cancellationToken);
		targetDataSource.listen(cb2, cancellationToken);
	}

	public map<D>(callback: (value: T) => D, cancellationToken?: CancellationToken): DataSource<D> {
		const mappedSource = new DataSource<D>(callback(this.value));
		this.listen((value) => {
			mappedSource.update(callback(value));
		}, cancellationToken);
		return mappedSource;
	}

	/**
	 * Duplex map is like map except that changes to the mapped stream will be backpropagated. This is useful for making duplex (both ways) data streams
	 * @param callback
	 * @param reverseMap
	 * @param cancellationToken
	 */
	public mapDuplex<D>(callback: (value: T) => D, reverseMap: (value: D) => T, cancellationToken?: CancellationToken): DataSource<D> {
		const mappedSource = new DataSource<D>(callback(this.value));
		const cb = (value) => mappedSource.backPropagate(cb2, callback(value));
		const cb2 = (value) => this.backPropagate(cb, reverseMap(value));

		this.listen(cb, cancellationToken);
		mappedSource.listen(cb2, cancellationToken);
		return mappedSource;
	}

	public unique(cancellationToken?: CancellationToken): DataSource<T> {
		const uniqueSource = new DataSource<T>(this.value);
		this.listen((value) => {
			if (value !== uniqueSource.value) {
				uniqueSource.update(value);
			}
		}, cancellationToken);
		return uniqueSource;
	}

	public uniqueDuplex(cancellationToken?: CancellationToken): DataSource<T> {
		const uniqueSource = new DataSource<T>(this.value);
		const cb = (value) => {
			if (value !== uniqueSource.value) {
				uniqueSource.backPropagate(cb2, value);
			}
		};
		const cb2 = (value) => {
			if (value !== this.value) {
				this.backPropagate(cb, value);
			}
		};

		this.listen(cb, cancellationToken);
		uniqueSource.listen(cb2, cancellationToken);
		return uniqueSource;
	}

	public reduce(reducer: (p: T, c: T) => T, initialValue: T, cancellationToken?: CancellationToken): DataSource<T> {
		const reduceSource = new DataSource<T>(initialValue);
		this.listen((v) => reduceSource.update(reducer(reduceSource.value, v)), cancellationToken);

		return reduceSource;
	}

	public aggregate<D, E>(otherSource: DataSource<D>, combinator: (self: T, other: D) => E, cancellationToken?: CancellationToken): DataSource<E> {
		const aggregatedSource = new DataSource<E>(combinator(this.value, otherSource.value));

		this.listen(() => aggregatedSource.update(combinator(this.value, otherSource.value)), cancellationToken);
		otherSource.listen(() => aggregatedSource.update(combinator(this.value, otherSource.value)), cancellationToken);

		return aggregatedSource;
	}

	public combine(otherSource: DataSource<T>, cancellationToken?: CancellationToken): DataSource<T> {
		const combinedDataSource = new DataSource<T>();
		this.pipe(combinedDataSource, cancellationToken);
		otherSource.pipe(combinedDataSource, cancellationToken);

		return combinedDataSource;
	}

	public debounce(time: number, cancellationToken?: CancellationToken): DataSource<T> {
		const debouncedDataSource = new DataSource<T>();
		let timeout;

		this.listen((v) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				debouncedDataSource.update(v);
			}, time);
		}, cancellationToken);

		return debouncedDataSource;
	}

	public buffer(time: number, cancellationToken?: CancellationToken): DataSource<T[]> {
		const bufferedDataSource = new DataSource<T[]>();
		let timeout;
		let buffer = [];

		this.listen((v) => {
			buffer.push(v);
			if (!timeout) {
				timeout = setTimeout(() => {
					timeout = undefined;
					bufferedDataSource.update(buffer);
					buffer = [];
				}, time);
			}
		}, cancellationToken);

		return bufferedDataSource;
	}

	public queue(time: number, cancellationToken?: CancellationToken): ArrayDataSource<T> {
		const queueDataSource = new ArrayDataSource<T>();

		this.listen((v) => {
			queueDataSource.push(v);
		}, cancellationToken);

		return queueDataSource;
	}

	public pick(key: keyof T, cancellationToken?: CancellationToken): DataSource<T[typeof key]> {
		const subDataSource: DataSource<T[typeof key]> = new DataSource(this.value?.[key]);

		this.listen((v) => {
			if (v !== undefined && v !== null) {
				subDataSource.update(v[key]);
			} else {
				subDataSource.update(v as null | undefined);
			}
		}, cancellationToken);

		return subDataSource;
	}

	public cancelAll(): void {
		this.updateEvent.cancelAll();
	}
}

export interface CollectionChange<T> {
	operation: 'replace' | 'swap' | 'add' | 'remove';
	operationDetailed: 'replace' | 'append' | 'prepend' | 'removeRight' | 'removeLeft' | 'remove' | 'swap' | 'clear';
	count?: number;
	index: number;
	index2?: number;
	target?: T;
	items: T[];
	newState: T[];
}
export class ArrayDataSource<T> {
	protected data: T[];
	private updateEvent: EventEmitter<CollectionChange<T>>;

	constructor(initialData?: T[]) {
		if (initialData) {
			this.data = initialData.slice();
		} else {
			this.data = [];
		}
		this.updateEvent = new EventEmitter();
	}

	/**
	 * Same as listen but will immediately call the callback with an append of all existing elements first
	 */
	public listenAndRepeat(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void> {
		callback({
			operation: 'add',
			operationDetailed: 'append',
			index: 0,
			items: this.data,
			newState: this.data,
			count: this.data.length
		});
		return this.listen(callback, cancellationToken);
	}

	public listen(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateEvent.subscribe(callback, cancellationToken).cancel;
	}

	public get length() {
		return this.data.length;
	}

	public getData(): T[] {
		return this.data.slice();
	}

	public get(index: number): T {
		return this.data[index];
	}

	public set(index: number, item: T): void {
		const old = this.data[index];
		if (old === item) {
			return;
		}
		this.data[index] = item;
		this.update({ operation: 'replace', operationDetailed: 'replace', target: old, count: 1, index, items: [item], newState: this.data });
	}

	public swap(indexA: number, indexB: number): void {
		if (indexA === indexB) {
			return;
		}

		const itemA = this.data[indexA];
		const itemB = this.data[indexB];
		this.data[indexB] = itemA;
		this.data[indexA] = itemB;

		this.update({ operation: 'swap', operationDetailed: 'swap', index: indexA, index2: indexB, items: [itemA, itemB], newState: this.data });
	}

	public swapItems(itemA: T, itemB: T): void {
		if (itemA === itemB) {
			return;
		}

		const indexA = this.data.indexOf(itemA);
		const indexB = this.data.indexOf(itemB);
		if (indexA !== -1 && indexB !== -1) {
			this.data[indexB] = itemA;
			this.data[indexA] = itemB;
		}

		this.update({ operation: 'swap', operationDetailed: 'swap', index: indexA, index2: indexB, items: [itemA, itemB], newState: this.data });
	}

	public push(...items: T[]) {
		this.data.push(...items);
		this.update({
			operation: 'add',
			operationDetailed: 'append',
			count: items.length,
			index: this.data.length - items.length,
			items,
			newState: this.data
		});
	}

	public unshift(...items: T[]) {
		this.data.unshift(...items);
		this.update({ operation: 'add', operationDetailed: 'prepend', count: items.length, items, index: 0, newState: this.data });
	}

	public pop(): T {
		const item = this.data.pop();
		this.update({
			operation: 'remove',
			operationDetailed: 'removeRight',
			count: 1,
			index: this.data.length,
			items: [item],
			newState: this.data
		});

		return item;
	}

	public merge(newData: T[]): void {
		for (let i = 0; i < newData.length; i++) {
			if (this.data[i] !== newData[i]) {
				if (this.length > i) {
					this.set(i, newData[i]);
				} else {
					this.push(newData[i]);
				}
			}
		}
		if (this.length > newData.length) {
			this.removeRight(this.length - newData.length);
		}
	}

	public removeRight(count: number): void {
		const length = this.length;
		const result = this.data.splice(length - count, count);
		this.update({ operation: 'remove', operationDetailed: 'removeRight', count, index: length - count, items: result, newState: this.data });
	}

	public removeLeft(count: number): void {
		const result = this.data.splice(0, count);
		this.update({ operation: 'remove', operationDetailed: 'removeLeft', count, index: 0, items: result, newState: this.data });
	}
	public remove(item: T): void {
		const index = this.data.indexOf(item);
		if (index !== -1) {
			this.data.splice(index, 1);
			this.update({ operation: 'remove', operationDetailed: 'remove', count: 1, index, items: [item], newState: this.data });
		}
	}

	public clear(): void {
		const items = this.data;
		this.data = [];
		this.update({
			operation: 'remove',
			operationDetailed: 'clear',
			count: items.length,
			index: 0,
			items,
			newState: this.data
		});
	}

	public shift(): T {
		const item = this.data.shift();
		this.update({ operation: 'remove', operationDetailed: 'removeLeft', items: [item], count: 1, index: 0, newState: this.data });

		return item;
	}

	public toArray(): T[] {
		return this.data.slice();
	}

	public sort(comparator: (a: T, b: T) => number, cancellationToken?: CancellationToken): SortedArrayView<T> {
		return new SortedArrayView(this, comparator, cancellationToken);
	}

	public filter(callback: Predicate<T>, cancellationToken?: CancellationToken): FilteredArrayView<T> {
		return new FilteredArrayView(this, callback, cancellationToken);
	}

	public forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void {
		return this.data.forEach(callbackfn, thisArg);
	}

	public toDataSource(): DataSource<T[]> {
		const stream = new DataSource(this.data);
		this.listen((s) => {
			stream.update(s.newState);
		});
		return stream;
	}

	private update(change: CollectionChange<T>) {
		this.updateEvent.fire(change);
	}
}

export class SortedArrayView<T> extends ArrayDataSource<T> {
	private comparator: (a: T, b: T) => number;

	constructor(parent: ArrayDataSource<T>, comparator: (a: T, b: T) => number, cancellationToken?: CancellationToken) {
		const initial = (parent as SortedArrayView<T>).data.slice().sort(comparator);
		super(initial);
		this.comparator = comparator;

		parent.listen((change) => {
			switch (change.operationDetailed) {
				case 'removeLeft':
					this.removeLeft(change.count);
					break;
				case 'removeRight':
					this.removeRight(change.count);
					break;
				case 'remove':
					this.remove(change.items[0]);
					break;
				case 'clear':
					this.data.length = 0;
					break;
				case 'prepend':
					this.unshift(...change.items);
					this.data.sort(this.comparator);
					break;
				case 'append':
					this.push(...change.items);
					this.data.sort(this.comparator);
					break;
				case 'swap':
					break;
				case 'replace':
					this.set(change.index, change.items[0]);
					this.data.sort(this.comparator);
					break;
			}
		}, cancellationToken);
	}
}

export class FilteredArrayView<T> extends ArrayDataSource<T> {
	private viewFilter: Predicate<T>;
	private parent: ArrayDataSource<T>;
	constructor(parent: ArrayDataSource<T>, filter: Predicate<T>, cancellationToken?: CancellationToken) {
		const initial = (parent as FilteredArrayView<T>).data.filter(filter);
		super(initial);

		this.parent = parent;
		this.viewFilter = filter;
		parent.listen((change) => {
			let filteredItems;
			switch (change.operationDetailed) {
				case 'removeLeft':
				case 'removeRight':
				case 'remove':
				case 'clear':
					for (const item of change.items) {
						this.remove(item);
					}
					break;
				case 'prepend':
					filteredItems = change.items.filter(this.viewFilter);
					this.unshift(...filteredItems);
					break;
				case 'append':
					filteredItems = change.items.filter(this.viewFilter);
					this.push(...filteredItems);
					break;
				case 'swap':
					const indexA = this.data.indexOf(change.items[0]);
					const indexB = this.data.indexOf(change.items[1]);
					if (indexA !== -1 && indexB !== -1) {
						this.swap(indexA, indexB);
					}
					break;
				case 'replace':
					const index = this.data.indexOf(change.target);
					if (index !== -1) {
						const acceptNew = this.viewFilter(change.items[0]);
						if (acceptNew) {
							this.set(index, change.items[0]);
						} else {
							this.remove(change.target);
						}
					}
					break;
			}
		}, cancellationToken);
	}

	/**
	 * Replaces the filter function
	 * @param filter
	 */
	public updateFilter(filter: Predicate<T>): void {
		if (this.viewFilter === filter) {
			return;
		}
		this.viewFilter = filter;
		this.refresh();
	}

	/**
	 * Recalculates the filter. Only needed if your filter function isn't pure and you know the result would be different if run again compared to before
	 */
	public refresh() {
		this.clear();
		const data = (this.parent as FilteredArrayView<T>).data.filter(this.viewFilter);
		this.push(...data);
	}
}
