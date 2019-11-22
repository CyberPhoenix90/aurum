import { CancellationToken } from '../utilities/cancellation_token';
import { Callback } from '../utilities/common';

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

	public listen(callback: (value: T) => void, cancellationToken?: CancellationToken): Callback<void> {
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
		const uniqueSource = new DataSource<T>();
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
