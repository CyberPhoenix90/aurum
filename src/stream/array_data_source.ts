import { EventEmitter } from './event_emitter';
import { DataSource } from './data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { Predicate } from '../utilities/common';

export interface CollectionChange<T> {
	operation: 'replace' | 'append' | 'prepend' | 'remove' | 'swap';
	count?: number;
	index: number;
	index2?: number;
	target?: T;
	items: T[];
	newState: T[];
}
export class ArrayDataSource<T> {
	protected data: T[];
	public onChange: EventEmitter<CollectionChange<T>>;

	constructor(initialData?: T[]) {
		if (initialData) {
			this.data = initialData.slice();
		} else {
			this.data = [];
		}
		this.onChange = new EventEmitter();
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
		this.onChange.fire({ operation: 'replace', target: old, count: 1, index, items: [item], newState: this.data });
	}

	public swap(indexA: number, indexB: number): void {
		if (indexA === indexB) {
			return;
		}

		const itemA = this.data[indexA];
		const itemB = this.data[indexB];
		this.data[indexB] = itemA;
		this.data[indexA] = itemB;

		this.onChange.fire({ operation: 'swap', index: indexA, index2: indexB, items: [itemA, itemB], newState: this.data });
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

		this.onChange.fire({ operation: 'swap', index: indexA, index2: indexB, items: [itemA, itemB], newState: this.data });
	}

	public push(...items: T[]) {
		this.data.push(...items);
		this.onChange.fire({
			operation: 'append',
			count: items.length,
			index: this.data.length - items.length,
			items,
			newState: this.data
		});
	}

	public unshift(...items: T[]) {
		this.data.unshift(...items);
		this.onChange.fire({ operation: 'prepend', count: items.length, items, index: 0, newState: this.data });
	}

	public pop(): T {
		const item = this.data.pop();
		this.onChange.fire({
			operation: 'remove',
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
		this.onChange.fire({ operation: 'remove', count, index: this.length - count, items: result, newState: this.data });
	}

	public removeLeft(count: number): void {
		const result = this.data.splice(0, count);
		this.onChange.fire({ operation: 'remove', count, index: 0, items: result, newState: this.data });
	}

	public remove(item: T): void {
		const index = this.data.indexOf(item);
		if (index !== -1) {
			this.data.splice(index, 1);
			this.onChange.fire({ operation: 'remove', count: 1, index, items: [item], newState: this.data });
		}
	}

	public clear(): void {
		const items = this.data;
		this.data = [];
		this.onChange.fire({
			operation: 'remove',
			count: items.length,
			index: 0,
			items,
			newState: this.data
		});
	}

	public shift(): T {
		const item = this.data.shift();
		this.onChange.fire({ operation: 'remove', items: [item], count: 1, index: 0, newState: this.data });

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
		this.onChange.subscribe((s) => {
			stream.update(s.newState);
		});
		return stream;
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

		parent.onChange.subscribe((change) => {
			let filteredItems;
			switch (change.operation) {
				case 'remove':
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
