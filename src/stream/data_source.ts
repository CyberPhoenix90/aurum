import { CancellationToken } from '../utilities/cancellation_token';
import { Callback, Predicate } from '../utilities/common';

export class DataSource<T> {
	public value: T;
	private listeners: Array<(value: T) => void>;

	constructor(initialValue?: T) {
		this.value = initialValue;
		this.listeners = [];
	}

	public update(newValue: T) {
		this.value = newValue;
		for (const l of this.listeners) {
			l(newValue);
		}
	}

	/**
	 * Same as listen but will immediately call the callback with the current value first
	 */
	public listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		callback(this.value);
		return this.listen(callback, cancellationToken);
	}

	public listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
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

	public filter(callback: (value: T) => boolean, cancellationToken?: CancellationToken): DataSource<T> {
		const filteredSource = new DataSource<T>();
		this.listen((value) => {
			if (callback(value)) {
				filteredSource.update(value);
			}
		}, cancellationToken);
		return filteredSource;
	}

	public pipe(targetDataSource: DataSource<T>, cancellationToken?: CancellationToken): void {
		this.listen((v) => targetDataSource.update(v), cancellationToken);
	}

	public map<D>(callback: (value: T) => D, cancellationToken?: CancellationToken): DataSource<D> {
		const mappedSource = new DataSource<D>(callback(this.value));
		this.listen((value) => {
			mappedSource.update(callback(value));
		}, cancellationToken);
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
		this.listeners.length = 0;
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
	public listeners: Callback<CollectionChange<T>>[];

	constructor(initialData?: T[]) {
		if (initialData) {
			this.data = initialData.slice();
		} else {
			this.data = [];
		}
		this.listeners = [];
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
		const result = this.data.splice(this.length - count, count);
		this.update({ operation: 'remove', operationDetailed: 'removeRight', count, index: this.length - count, items: result, newState: this.data });
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
		for (const l of this.listeners) {
			l(change);
		}
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

	public updateFilter(filter: Predicate<T>): void {
		if (this.viewFilter === filter) {
			return;
		}
		this.viewFilter = filter;
		this.refresh();
	}

	protected refresh() {
		this.clear();
		const data = (this.parent as FilteredArrayView<T>).data.filter(this.viewFilter);
		this.push(...data);
	}
}
