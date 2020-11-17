import { debugDeclareUpdate, debugMode, debugRegisterConsumer, debugRegisterLink, debugRegisterStream } from '../debug_mode';
import { CancellationToken } from '../utilities/cancellation_token';
import { Callback, Predicate } from '../utilities/common';
import { EventEmitter } from '../utilities/event_emitter';
import { DuplexDataSource } from './duplex_data_source';
import {
	DataSourceDelayFilterOperator,
	DataSourceFilterOperator,
	DataSourceMapDelayFilterOperator,
	DataSourceMapOperator,
	DataSourceOperator,
	OperationType
} from './operator_model';
import { Stream } from './stream';

export interface ReadOnlyDataSource<T> {
	readonly value: T;
	readonly name: string;
	listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
	listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
	listenOnce(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
	awaitNextUpdate(cancellationToken?: CancellationToken): Promise<T>;
	transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, I = H, J = I, K = J>(
		operationA: DataSourceOperator<T, A>,
		operationB?: DataSourceOperator<A, B> | CancellationToken,
		operationC?: DataSourceOperator<B, C> | CancellationToken,
		operationD?: DataSourceOperator<C, D> | CancellationToken,
		operationE?: DataSourceOperator<D, E> | CancellationToken,
		operationF?: DataSourceOperator<E, F> | CancellationToken,
		operationG?: DataSourceOperator<F, G> | CancellationToken,
		operationH?: DataSourceOperator<G, H> | CancellationToken,
		operationI?: DataSourceOperator<H, I> | CancellationToken,
		operationJ?: DataSourceOperator<I, J> | CancellationToken,
		operationK?: DataSourceOperator<J, K> | CancellationToken,
		cancellationToken?: CancellationToken
	): ReadOnlyDataSource<K>;
}

export interface GenericDataSource<T> {
	readonly value: T;
	listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
	listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
	listenOnce(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
	awaitNextUpdate(cancellationToken?: CancellationToken): Promise<T>;
	withInitial(value: T): this;
	aggregate<R, A>(otherSources: [ReadOnlyDataSource<A>], combinator: (self: T, other: A) => R, cancellationToken?: CancellationToken): DataSource<R>;
	aggregate<R, A, B>(
		otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>],
		combinator?: (self: T, second: A, third: B) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	aggregate<R, A, B, C>(
		otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>],
		combinator?: (self: T, second: A, third: B, fourth: C) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	aggregate<R, A, B, C, D>(
		otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	aggregate<R, A, B, C, D, E>(
		otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>, ReadOnlyDataSource<E>],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	aggregate<R, A, B, C, D, E, F>(
		otherSources: [
			ReadOnlyDataSource<A>,
			ReadOnlyDataSource<B>,
			ReadOnlyDataSource<C>,
			ReadOnlyDataSource<D>,
			ReadOnlyDataSource<E>,
			ReadOnlyDataSource<F>
		],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	aggregate<R, A, B, C, D, E, F, G>(
		otherSources: [
			ReadOnlyDataSource<A>,
			ReadOnlyDataSource<B>,
			ReadOnlyDataSource<C>,
			ReadOnlyDataSource<D>,
			ReadOnlyDataSource<E>,
			ReadOnlyDataSource<F>,
			ReadOnlyDataSource<G>
		],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	aggregate<R, A, B, C, D, E, F, G, H>(
		otherSources: [
			ReadOnlyDataSource<A>,
			ReadOnlyDataSource<B>,
			ReadOnlyDataSource<C>,
			ReadOnlyDataSource<D>,
			ReadOnlyDataSource<E>,
			ReadOnlyDataSource<F>,
			ReadOnlyDataSource<G>,
			ReadOnlyDataSource<H>
		],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	aggregate<R, A, B, C, D, E, F, G, H, I>(
		otherSources: [
			ReadOnlyDataSource<A>,
			ReadOnlyDataSource<B>,
			ReadOnlyDataSource<C>,
			ReadOnlyDataSource<D>,
			ReadOnlyDataSource<E>,
			ReadOnlyDataSource<F>,
			ReadOnlyDataSource<G>,
			ReadOnlyDataSource<H>
		],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	aggregate<R, A, B, C, D, E, F, G, H, I>(
		otherSources: [
			ReadOnlyDataSource<A>,
			ReadOnlyDataSource<B>,
			ReadOnlyDataSource<C>,
			ReadOnlyDataSource<D>,
			ReadOnlyDataSource<E>,
			ReadOnlyDataSource<F>,
			ReadOnlyDataSource<G>,
			ReadOnlyDataSource<H>,
			ReadOnlyDataSource<I>
		],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H, tenth: I) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	aggregate<R>(otherSources: ReadOnlyDataSource<any>[], combinator?: (...data: any[]) => R, cancellationToken?: CancellationToken): DataSource<R>;
	transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, I = H, J = I, K = J>(
		operationA: DataSourceOperator<T, A>,
		operationB?: DataSourceOperator<A, B> | CancellationToken,
		operationC?: DataSourceOperator<B, C> | CancellationToken,
		operationD?: DataSourceOperator<C, D> | CancellationToken,
		operationE?: DataSourceOperator<D, E> | CancellationToken,
		operationF?: DataSourceOperator<E, F> | CancellationToken,
		operationG?: DataSourceOperator<F, G> | CancellationToken,
		operationH?: DataSourceOperator<G, H> | CancellationToken,
		operationI?: DataSourceOperator<H, I> | CancellationToken,
		operationJ?: DataSourceOperator<I, J> | CancellationToken,
		operationK?: DataSourceOperator<J, K> | CancellationToken,
		cancellationToken?: CancellationToken
	): DataSource<K>;
}

/**
 * Datasources wrap a value and allow you to update it in an observable way. Datasources can be manipulated like streams and can be bound directly in the JSX syntax and will update the html whenever the value changes
 */
export class DataSource<T> implements GenericDataSource<T> {
	/**
	 * The current value of this data source, can be changed through update
	 */
	public value: T;
	private primed: boolean;
	private updating: boolean;
	public name: string;
	protected updateEvent: EventEmitter<T>;
	protected errorHandler: (error: any) => T;
	protected errorEvent: EventEmitter<Error>;

	constructor(initialValue?: T, name: string = 'RootDataSource') {
		this.name = name;
		this.value = initialValue;
		if (debugMode) {
			debugRegisterStream(this, new Error().stack);
		}
		this.primed = initialValue !== undefined;
		this.errorEvent = new EventEmitter();
		this.updateEvent = new EventEmitter();
	}

	public static fromMultipleSources<T>(sources: ReadOnlyDataSource<T>[], cancellation?: CancellationToken): DataSource<T> {
		const result = new DataSource<T>();

		for (const s of sources) {
			if (debugMode) {
				debugRegisterLink(s as any, result);
			}
			(s as any).listenInternal((v) => result.update(v), cancellation);
		}

		result.name = `Combination of [${sources.map((v) => v.name).join(' & ')}]`;

		return result;
	}

	/**
	 * Allows tapping into the stream and calls a function for each value.
	 */
	public tap(callback: (value: T) => void, cancellationToken?: CancellationToken): DataSource<T> {
		this.listen((value) => {
			callback(value);
		}, cancellationToken);
		return this;
	}
	/**
	 * Assign a function to handle errors and map them back to regular values. Rethrow the error in case you want to fallback to emitting error
	 */
	public handleErrors(callback: (error: any) => T): this {
		this.errorHandler = callback;
		return this;
	}

	public onError(callback: (error: any) => void, cancellationToken?: CancellationToken): this {
		this.errorEvent.subscribe(callback, cancellationToken);
		return this;
	}

	public emitError(e: Error): void {
		if (this.errorHandler) {
			try {
				return this.update(this.errorHandler(e));
			} catch (newError) {
				e = newError;
			}
		}
		if (this.errorEvent.hasSubscriptions()) {
			this.errorEvent.fire(e);
		} else {
			throw e;
		}
	}

	/**
	 * Updates with the same value as the last value
	 */
	public repeatLast(): this {
		this.update(this.value);
		return this;
	}

	/**
	 * Updates the value in the data source and calls the listen callback for all listeners
	 * @param newValue new value for the data source
	 */
	public update(newValue: T): void {
		this.primed = true;
		if (this.updating) {
			throw new Error(
				'Problem in data source: Unstable value propagation. When updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed'
			);
		}
		this.updating = true;
		this.value = newValue;
		this.updateEvent.fire(newValue);
		if (debugMode) {
			debugDeclareUpdate(this, newValue, new Error().stack);
		}
		this.updating = false;
	}

	/**
	 * Updates the data source with a value if it has never had a value before
	 */
	public withInitial(value: T): this {
		if (!this.primed) {
			this.update(value);
		}

		return this;
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

	private listenAndRepeatInternal(callback: Callback<T>, cancellationToken?: CancellationToken, parent?: ReadOnlyDataSource<any>): Callback<void> {
		callback(this.value);
		return this.listenInternal(callback, cancellationToken, parent);
	}

	/**
	 * Subscribes to the updates of the data stream
	 * @param callback Callback to call when value is updated
	 * @param cancellationToken Optional token to control the cancellation of the subscription
	 * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
	 */
	public listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		if (debugMode) {
			debugRegisterConsumer(this, callback.toString(), new Error().stack);
		}
		return this.listenInternal(callback, cancellationToken);
	}

	private listenInternal(callback: Callback<T>, cancellationToken?: CancellationToken, parent?: ReadOnlyDataSource<any>): Callback<void> {
		const cancel = this.updateEvent.subscribe(callback, cancellationToken).cancel;

		return cancel;
	}

	/**
	 * Subscribes to the updates of the data stream for a single update
	 * @param callback Callback to call when value is updated
	 * @param cancellationToken Optional token to control the cancellation of the subscription
	 * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
	 */
	public listenOnce(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateEvent.subscribeOnce(callback, cancellationToken).cancel;
	}

	public transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, I = H, J = I, K = J>(
		operationA: DataSourceOperator<T, A>,
		operationB?: DataSourceOperator<A, B> | CancellationToken,
		operationC?: DataSourceOperator<B, C> | CancellationToken,
		operationD?: DataSourceOperator<C, D> | CancellationToken,
		operationE?: DataSourceOperator<D, E> | CancellationToken,
		operationF?: DataSourceOperator<E, F> | CancellationToken,
		operationG?: DataSourceOperator<F, G> | CancellationToken,
		operationH?: DataSourceOperator<G, H> | CancellationToken,
		operationI?: DataSourceOperator<H, I> | CancellationToken,
		operationJ?: DataSourceOperator<I, J> | CancellationToken,
		operationK?: DataSourceOperator<J, K> | CancellationToken,
		cancellationToken?: CancellationToken
	): DataSource<K> {
		let token;
		const operations: DataSourceOperator<any, any>[] = [
			operationA,
			operationB,
			operationC,
			operationD,
			operationE,
			operationF,
			operationG,
			operationH,
			operationI,
			operationJ,
			operationK
		].filter((e) => e && (e instanceof CancellationToken ? ((token = e), false) : true)) as DataSourceOperator<any, any>[];
		if (cancellationToken) {
			token = cancellationToken;
		}
		const result = new DataSource<K>(undefined, this.name + ' ' + operations.map((v) => v.name).join(' '));
		if (debugMode) {
			debugRegisterLink(this, result);
		}
		(this.primed ? this.listenAndRepeatInternal : this.listenInternal).call(this, processTransform<T, K>(operations as any, result), token);
		this.onError((e) => result.emitError(e), token);

		return result;
	}

	/**
	 * Combines two sources into a third source that listens to updates from both parent sources.
	 * @param otherSource Second parent for the new source
	 * @param combinator Method allowing you to combine the data from both parents on update. Called each time a parent is updated with the latest values of both parents
	 * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
	 */
	public aggregate<R, A>(otherSources: [ReadOnlyDataSource<A>], combinator: (self: T, other: A) => R, cancellationToken?: CancellationToken): DataSource<R>;
	public aggregate<R, A, B>(
		otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>],
		combinator?: (self: T, second: A, third: B) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	public aggregate<R, A, B, C>(
		otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>],
		combinator?: (self: T, second: A, third: B, fourth: C) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	public aggregate<R, A, B, C, D>(
		otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	public aggregate<R, A, B, C, D, E>(
		otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>, ReadOnlyDataSource<E>],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	public aggregate<R, A, B, C, D, E, F>(
		otherSources: [
			ReadOnlyDataSource<A>,
			ReadOnlyDataSource<B>,
			ReadOnlyDataSource<C>,
			ReadOnlyDataSource<D>,
			ReadOnlyDataSource<E>,
			ReadOnlyDataSource<F>
		],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	public aggregate<R, A, B, C, D, E, F, G>(
		otherSources: [
			ReadOnlyDataSource<A>,
			ReadOnlyDataSource<B>,
			ReadOnlyDataSource<C>,
			ReadOnlyDataSource<D>,
			ReadOnlyDataSource<E>,
			ReadOnlyDataSource<F>,
			ReadOnlyDataSource<G>
		],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	public aggregate<R, A, B, C, D, E, F, G, H>(
		otherSources: [
			ReadOnlyDataSource<A>,
			ReadOnlyDataSource<B>,
			ReadOnlyDataSource<C>,
			ReadOnlyDataSource<D>,
			ReadOnlyDataSource<E>,
			ReadOnlyDataSource<F>,
			ReadOnlyDataSource<G>,
			ReadOnlyDataSource<H>
		],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	public aggregate<R, A, B, C, D, E, F, G, H, I>(
		otherSources: [
			ReadOnlyDataSource<A>,
			ReadOnlyDataSource<B>,
			ReadOnlyDataSource<C>,
			ReadOnlyDataSource<D>,
			ReadOnlyDataSource<E>,
			ReadOnlyDataSource<F>,
			ReadOnlyDataSource<G>,
			ReadOnlyDataSource<H>
		],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	public aggregate<R, A, B, C, D, E, F, G, H, I>(
		otherSources: [
			ReadOnlyDataSource<A>,
			ReadOnlyDataSource<B>,
			ReadOnlyDataSource<C>,
			ReadOnlyDataSource<D>,
			ReadOnlyDataSource<E>,
			ReadOnlyDataSource<F>,
			ReadOnlyDataSource<G>,
			ReadOnlyDataSource<H>,
			ReadOnlyDataSource<I>
		],
		combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H, tenth: I) => R,
		cancellationToken?: CancellationToken
	): DataSource<R>;
	public aggregate<R>(otherSources: ReadOnlyDataSource<any>[], combinator?: (...data: any[]) => R, cancellationToken?: CancellationToken): DataSource<R> {
		cancellationToken = cancellationToken ?? new CancellationToken();

		const aggregatedSource = new DataSource<R>(combinator(this.value, ...otherSources.map((s) => s.value)));

		for (let i = 0; i < otherSources.length; i++) {
			otherSources[i].listen(() => {
				aggregatedSource.update(combinator(this.value, ...otherSources.map((s) => s.value)));
			}, cancellationToken);
		}

		this.listen(() => aggregatedSource.update(combinator(this.value, ...otherSources.map((s) => s.value))), cancellationToken);

		return aggregatedSource;
	}

	/**
	 * Forwards all updates from this source to another
	 * @param targetDataSource datasource to pipe the updates to
	 * @param cancellationToken  Cancellation token to cancel the subscription the target datasource has to this datasource
	 */
	public pipe(targetDataSource: DataSource<T>, cancellationToken?: CancellationToken): this {
		this.listen((v) => targetDataSource.update(v), cancellationToken);

		return this;
	}
	/**
	 * Like aggregate except that no combination method is needed as a result both parents must have the same type and the new stream just exposes the last update recieved from either parent
	 * @param otherSource Second parent for the new source
	 * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
	 */
	public combine(otherSources: DataSource<T>[], cancellationToken?: CancellationToken): DataSource<T> {
		cancellationToken = cancellationToken ?? new CancellationToken();

		let combinedDataSource: DataSource<T> | DuplexDataSource<T> | Stream<T, any>;
		if (this.primed) {
			combinedDataSource = new DataSource<T>(this.value);
		} else {
			combinedDataSource = new DataSource<T>();
		}
		this.pipe(combinedDataSource, cancellationToken);
		for (const otherSource of otherSources) {
			otherSource.pipe(combinedDataSource, cancellationToken);
		}

		return combinedDataSource;
	}

	/**
	 * Returns a promise that resolves when the next update occurs
	 * @param cancellationToken
	 */
	public awaitNextUpdate(cancellationToken?: CancellationToken): Promise<T> {
		return new Promise((resolve) => {
			this.listenOnce((value) => resolve(value), cancellationToken);
		});
	}

	/**
	 * Remove all listeners
	 */
	public cancelAll(): void {
		this.updateEvent.cancelAll();
	}
}

export interface CollectionChange<T> {
	operation: 'replace' | 'swap' | 'add' | 'remove' | 'merge';
	operationDetailed: 'replace' | 'append' | 'prepend' | 'removeRight' | 'removeLeft' | 'remove' | 'swap' | 'clear' | 'merge' | 'insert';
	count?: number;
	index: number;
	index2?: number;
	target?: T;
	items: T[];
	newState: T[];
	previousState?: T[];
}
export class ArrayDataSource<T> {
	protected data: T[];
	protected updateEvent: EventEmitter<CollectionChange<T>>;
	private lengthSource: DataSource<number>;
	private name: string;

	constructor(initialData?: T[], name: string = 'RootArrayDataSource') {
		this.name = name;
		if (initialData) {
			this.data = initialData.slice();
		} else {
			this.data = [];
		}
		this.lengthSource = new DataSource(this.data.length, this.name + '.length');
		this.updateEvent = new EventEmitter();
	}

	public static fromMultipleSources<T>(sources: Array<ArrayDataSource<T> | T[]>, cancellationToken?: CancellationToken): ArrayDataSource<T> {
		const boundaries = [0];
		const result = new ArrayDataSource<T>(
			undefined,
			`ArrayDataSource of (${sources.reduce((p, c) => p + (c instanceof ArrayDataSource ? c.name + ' ' : ''), '')})`
		);

		for (let i = 0; i < sources.length; i++) {
			if (Array.isArray(sources[i])) {
				result.appendArray(sources[i] as T[]);
			} else {
				result.appendArray((sources[i] as ArrayDataSource<T>).data ?? []);
				let index = i;
				(sources[i] as ArrayDataSource<T>).listen((change) => {
					switch (change.operationDetailed) {
						case 'append':
						case 'prepend':
						case 'insert':
							result.insertAt(change.index + boundaries[index], ...change.items);
							for (let i = index + 1; i < boundaries.length; i++) {
								boundaries[i] += change.count;
							}
							break;
						case 'remove':
						case 'removeLeft':
						case 'removeRight':
						case 'clear':
							result.removeRange(change.index + boundaries[index], change.index + boundaries[index] + change.count);
							for (let i = index + 1; i < boundaries.length; i++) {
								boundaries[i] -= change.count;
							}
							break;
						case 'merge':
							throw new Error('Not yet supported');
						case 'replace':
							result.set(change.index + boundaries[index], change.items[0]);
							break;
						case 'swap':
							result.swap(change.index + boundaries[index], change.index2 + boundaries[index]);
							break;
					}
				}, cancellationToken);
			}
			boundaries.push(result.length.value);
		}

		return result;
	}

	/**
	 * Same as listen but will immediately call the callback with an append of all existing elements first
	 */
	public listenAndRepeat(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void> {
		if (this.data.length) {
			callback({
				operation: 'add',
				operationDetailed: 'append',
				index: 0,
				items: this.data,
				newState: this.data,
				count: this.data.length
			});
		}
		return this.listen(callback, cancellationToken);
	}

	public repeatCurrentState(): void {
		this.update({
			operation: 'remove',
			operationDetailed: 'clear',
			count: this.data.length,
			index: 0,
			items: this.data,
			newState: []
		});
		this.update({
			operation: 'add',
			operationDetailed: 'append',
			index: 0,
			items: this.data,
			newState: this.data,
			count: this.data.length
		});
	}

	public listen(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateEvent.subscribe(callback, cancellationToken).cancel;
	}

	public listenOnce(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateEvent.subscribeOnce(callback, cancellationToken).cancel;
	}

	/**
	 * Returns a promise that resolves when the next update occurs
	 * @param cancellationToken
	 */
	public awaitNextUpdate(cancellationToken?: CancellationToken): Promise<CollectionChange<T>> {
		return new Promise((resolve) => {
			this.listenOnce((value) => resolve(value), cancellationToken);
		});
	}

	public get length(): DataSource<number> {
		return this.lengthSource;
	}

	public getData(): ReadonlyArray<T> {
		return this.data;
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
		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}
	}

	public indexOf(item: T): number {
		return this.data.indexOf(item);
	}

	public lastIndexOf(item: T): number {
		return this.data.lastIndexOf(item);
	}

	public includes(item: T): boolean {
		return this.data.includes(item);
	}

	public replace(item: T, newItem: T): void {
		const index = this.indexOf(item);
		if (index !== -1) {
			this.set(index, newItem);
		}
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
		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}
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
		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}
	}

	public appendArray(items: T[]) {
		if (!items || items.length === 0) {
			return;
		}

		if (items.length < 65000) {
			this.data.push.apply(this.data, items);
		} else {
			console.warn('Appending over 65000 items in one go can lead to performance issues. Consider streaming your changes progressively');
			this.data = this.data.concat(items);
		}

		this.update({
			operation: 'add',
			operationDetailed: 'append',
			count: items.length,
			index: this.data.length - items.length,
			items,
			newState: this.data
		});
		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}
	}

	public insertAt(index: number, ...items: T[]) {
		if (items.length === 0) {
			return;
		}

		this.data.splice(index, 0, ...items);

		this.update({
			operation: 'add',
			operationDetailed: 'insert',
			count: items.length,
			index,
			items,
			newState: this.data
		});
		this.lengthSource.update(this.data.length);
	}

	public push(...items: T[]) {
		this.appendArray(items);
	}

	public unshift(...items: T[]) {
		this.data.unshift(...items);
		this.update({ operation: 'add', operationDetailed: 'prepend', count: items.length, items, index: 0, newState: this.data });
		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}
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

		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}
		return item;
	}

	public merge(newData: T[]): void {
		const old = this.data;
		this.data = newData.slice();

		this.update({
			operation: 'merge',
			operationDetailed: 'merge',
			previousState: old,
			index: 0,
			items: this.data,
			newState: this.data
		});
		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}
	}

	public removeRight(count: number): void {
		const length = this.data.length;
		const result = this.data.splice(length - count, count);
		this.update({ operation: 'remove', operationDetailed: 'removeRight', count, index: length - count, items: result, newState: this.data });
		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}
	}

	public removeLeft(count: number): void {
		const result = this.data.splice(0, count);
		this.update({ operation: 'remove', operationDetailed: 'removeLeft', count, index: 0, items: result, newState: this.data });
		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}
	}

	public removeAt(index: number): void {
		const removed = this.data.splice(index, 1);
		this.update({ operation: 'remove', operationDetailed: 'remove', count: removed.length, index, items: removed, newState: this.data });
		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}
	}

	public removeRange(start: number, end): void {
		const removed = this.data.splice(start, end - start);
		this.update({ operation: 'remove', operationDetailed: 'remove', count: removed.length, index: start, items: removed, newState: this.data });
		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}
	}

	public remove(item: T): void {
		const index = this.data.indexOf(item);
		if (index !== -1) {
			this.removeAt(index);
		}
	}

	public clear(): void {
		if (this.data.length === 0) {
			return;
		}

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
		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}
	}

	public shift(): T {
		const item = this.data.shift();
		this.update({ operation: 'remove', operationDetailed: 'removeLeft', items: [item], count: 1, index: 0, newState: this.data });
		if (this.lengthSource.value !== this.data.length) {
			this.lengthSource.update(this.data.length);
		}

		return item;
	}

	public toArray(): T[] {
		return this.data.slice();
	}

	public reverse(cancellationToken?: CancellationToken): ReversedArrayView<T> {
		const view = new ReversedArrayView<T>(this, cancellationToken, this.name + '.reverse()');

		return view;
	}

	public sort(comparator: (a: T, b: T) => number, dependencies: ReadOnlyDataSource<any>[] = [], cancellationToken?: CancellationToken): SortedArrayView<T> {
		const view = new SortedArrayView(this, comparator, cancellationToken, this.name + '.sort()');

		dependencies.forEach((dep) => {
			dep.listen(() => view.refresh());
		}, cancellationToken);

		return view;
	}

	public map<D>(mapper: (data: T) => D, dependencies: ReadOnlyDataSource<any>[] = [], cancellationToken?: CancellationToken): MappedArrayView<T, D> {
		const view = new MappedArrayView<T, D>(this, mapper, cancellationToken, this.name + '.map()');

		dependencies.forEach((dep) => {
			dep.listen(() => view.refresh());
		}, cancellationToken);

		return view;
	}

	public unique(cancellationToken?: CancellationToken): UniqueArrayView<T> {
		return new UniqueArrayView(this, cancellationToken, this.name + '.unique()');
	}

	public filter(callback: Predicate<T>, dependencies: ReadOnlyDataSource<any>[] = [], cancellationToken?: CancellationToken): FilteredArrayView<T> {
		const view = new FilteredArrayView(this, callback, cancellationToken, this.name + '.filter()');

		dependencies.forEach((dep) => {
			dep.listen(() => view.refresh(), cancellationToken);
		});

		return view;
	}

	public forEach(callbackfn: (value: T, index: number, array: T[]) => void): void {
		return this.data.forEach(callbackfn);
	}

	protected update(change: CollectionChange<T>) {
		this.updateEvent.fire(change);
	}
}

export class MappedArrayView<D, T> extends ArrayDataSource<T> {
	private parent: ArrayDataSource<D>;
	private mapper: (a: D) => T;

	constructor(parent: ArrayDataSource<D>, mapper: (a: D) => T, cancellationToken: CancellationToken = new CancellationToken(), name?: string) {
		const initial = parent.getData().map(mapper);
		super(initial, name);
		this.parent = parent;
		this.mapper = mapper;

		parent.listen((change) => {
			switch (change.operationDetailed) {
				case 'removeLeft':
					this.removeLeft(change.count);
					break;
				case 'removeRight':
					this.removeRight(change.count);
					break;
				case 'remove':
					this.remove(this.data[change.index]);
					break;
				case 'clear':
					this.clear();
					break;
				case 'prepend':
					this.unshift(...change.items.map(this.mapper));
					break;
				case 'append':
					this.appendArray(change.items.map(this.mapper));
					break;
				case 'insert':
					this.insertAt(change.index, ...change.items.map(this.mapper));
					break;
				case 'swap':
					this.swap(change.index, change.index2);
					break;
				case 'replace':
					this.set(change.index, this.mapper(change.items[0]));
					break;
				case 'merge':
					const old = this.data.slice();
					const source = change.previousState.slice();
					for (let i = 0; i < change.newState.length; i++) {
						if (this.data.length <= i) {
							this.data.push(this.mapper(change.newState[i]));
							source.push(change.newState[i]);
						} else if (source[i] !== change.newState[i]) {
							const index = source.indexOf(change.newState[i]);
							if (index !== -1) {
								const a = this.data[i];
								const b = this.data[index];
								this.data[i] = b;
								this.data[index] = a;
								const c = source[i];
								const d = source[index];
								source[i] = d;
								source[index] = c;
							} else {
								//@ts-ignore
								this.data.splice(i, 0, this.mapper(change.newState[i]));
								source.splice(i, 0, change.newState[i]);
							}
						}
					}
					if (this.data.length > change.newState.length) {
						this.data.length = change.newState.length;
					}
					this.update({
						operation: 'merge',
						operationDetailed: 'merge',
						previousState: old,
						index: 0,
						items: this.data,
						newState: this.data
					});
					break;
			}
		}, cancellationToken);
	}

	public refresh() {
		//@ts-ignore
		this.merge(this.parent.data.map(this.mapper));
	}
}

export class ReversedArrayView<T> extends ArrayDataSource<T> {
	private parent: ArrayDataSource<T>;

	constructor(parent: ArrayDataSource<T>, cancellationToken: CancellationToken = new CancellationToken(), name?: string) {
		const initial = parent
			.getData()
			.slice()
			.reverse();
		super(initial, name);
		this.parent = parent;

		parent.listen((change) => {
			switch (change.operationDetailed) {
				case 'removeLeft':
					this.removeRight(change.count);
					break;
				case 'removeRight':
					this.removeLeft(change.count);
					break;
				case 'remove':
					for (const item of change.items) {
						this.remove(item);
					}
					break;
				case 'clear':
					this.clear();
					break;
				case 'prepend':
					this.appendArray(change.items.reverse());
					break;
				case 'append':
					this.unshift(...change.items.reverse());
					break;
				case 'insert':
					this.merge(change.newState.slice().reverse());
					break;
				case 'merge':
					this.merge(change.items.slice().reverse());
					break;
				case 'swap':
					this.merge(change.newState.slice().reverse());
					break;
				case 'replace':
					this.merge(change.newState.slice().reverse());
					break;
			}
		}, cancellationToken);
	}

	public refresh() {
		this.merge(
			this.parent
				.getData()
				.slice()
				.reverse()
		);
	}
}

export class UniqueArrayView<T> extends ArrayDataSource<T> {
	constructor(parent: ArrayDataSource<T>, cancellationToken: CancellationToken = new CancellationToken(), name?: string) {
		const initial = Array.from(new Set(parent.getData()));
		super(initial, name);
		let filteredItems;

		parent.listen((change) => {
			switch (change.operationDetailed) {
				case 'removeLeft':
				case 'removeRight':
				case 'remove':
					for (const item of change.items) {
						if (!change.newState.includes(item)) {
							this.remove(item);
						}
					}
					break;
				case 'clear':
					this.clear();
					break;
				case 'prepend':
					filteredItems = change.items.filter((e) => !this.data.includes(e));
					this.unshift(...filteredItems);
					break;
				case 'append':
					filteredItems = change.items.filter((e) => !this.data.includes(e));
					this.appendArray(filteredItems);
					break;
				case 'insert':
					filteredItems = change.items.filter((e) => !this.data.includes(e));
					this.insertAt(change.index, ...filteredItems);
					break;
				case 'merge':
					this.merge(Array.from(new Set(parent.getData())));
					break;
				case 'swap':
					this.swap(change.index, change.index2);
					break;
				case 'replace':
					if (this.data.includes(change.items[0])) {
						this.remove(change.target);
					} else {
						this.set(change.index, change.items[0]);
					}
					break;
			}
		}, cancellationToken);
	}
}
export class SortedArrayView<T> extends ArrayDataSource<T> {
	private comparator: (a: T, b: T) => number;
	private parent: ArrayDataSource<T>;

	constructor(parent: ArrayDataSource<T>, comparator: (a: T, b: T) => number, cancellationToken: CancellationToken = new CancellationToken(), name?: string) {
		const initial = parent
			.getData()
			.slice()
			.sort(comparator);
		super(initial, name);
		this.parent = parent;
		this.comparator = comparator;

		parent.listen((change) => {
			switch (change.operationDetailed) {
				case 'removeLeft':
				case 'removeRight':
				case 'remove':
					for (const item of change.items) {
						this.remove(item);
					}
					break;
				case 'clear':
					this.clear();
					break;
				case 'prepend':
					this.unshift(...change.items);
					this.data.sort(this.comparator);
					break;
				case 'append':
					this.appendSorted(change.items);
					break;
				case 'insert':
					this.appendSorted(change.items);
					break;
				case 'merge':
					this.merge(change.items.slice().sort(this.comparator));
					break;
				case 'swap':
					break;
				case 'replace':
					this.remove(change.target);
					this.appendSorted(change.items);
					break;
			}
		}, cancellationToken);
	}

	private appendSorted(items: T[]) {
		this.merge(this.data.concat(items).sort(this.comparator));
	}

	public refresh() {
		this.merge(
			this.parent
				.getData()
				.slice()
				.sort(this.comparator)
		);
	}
}

export class FilteredArrayView<T> extends ArrayDataSource<T> {
	private viewFilter: Predicate<T>;
	private parent: ArrayDataSource<T>;
	constructor(parent: ArrayDataSource<T> | T[], filter?: Predicate<T>, cancellationToken: CancellationToken = new CancellationToken(), name?: string) {
		if (Array.isArray(parent)) {
			parent = new ArrayDataSource(parent);
		}
		filter = filter ?? (() => true);
		const initial = (parent as FilteredArrayView<T>).data.filter(filter);
		super(initial, name);

		this.parent = parent;
		this.viewFilter = filter;
		parent.listen((change) => {
			let filteredItems;
			switch (change.operationDetailed) {
				case 'clear':
					this.clear();
					break;
				case 'removeLeft':
				case 'removeRight':
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
					this.appendArray(filteredItems);
					break;
				case 'insert':
					filteredItems = change.items.filter(this.viewFilter);
					this.insertAt(change.index, ...filteredItems);
					break;
				case 'merge':
					this.merge(change.items.filter(this.viewFilter));
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
	 * @returns returns new size of array view after applying filter
	 */
	public updateFilter(filter: Predicate<T>): number {
		if (this.viewFilter === filter) {
			return;
		}
		this.viewFilter = filter;
		this.refresh();
		return this.data.length;
	}

	/**
	 * Recalculates the filter. Only needed if your filter function isn't pure and you know the result would be different if run again compared to before
	 */
	public refresh() {
		this.merge((this.parent as FilteredArrayView<T>).data.filter(this.viewFilter));
	}
}

export function processTransform<I, O>(operations: DataSourceOperator<any, any>[], result: DataSource<O>): Callback<I> {
	return async (v: any) => {
		try {
			for (const operation of operations) {
				switch (operation.operationType) {
					case OperationType.NOOP:
					case OperationType.MAP:
						v = (operation as DataSourceMapOperator<any, any>).operation(v);
						break;
					case OperationType.MAP_DELAY_FILTER:
						const tmp = await (operation as DataSourceMapDelayFilterOperator<any, any>).operation(v);
						if (tmp.cancelled) {
							return;
						} else {
							v = await tmp.item;
						}
						break;
					case OperationType.DELAY:
					case OperationType.MAP_DELAY:
						v = await (operation as DataSourceMapOperator<any, any>).operation(v);
						break;
					case OperationType.DELAY_FILTER:
						if (!(await (operation as DataSourceDelayFilterOperator<any>).operation(v))) {
							return;
						}
						break;
					case OperationType.FILTER:
						if (!(operation as DataSourceFilterOperator<any>).operation(v)) {
							return;
						}
						break;
				}
			}
			result.update(v);
		} catch (e) {
			result.emitError(e);
		}
	};
}
