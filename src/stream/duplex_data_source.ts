import { CancellationToken } from '../utilities/cancellation_token';
import { Callback } from '../utilities/common';
import { EventEmitter } from '../utilities/event_emitter';
import { DataSource, GenericDataSource, processTransform, ReadOnlyDataSource } from './data_source';
import { DataSourceOperator } from './operator_model';

export enum DataFlow {
	UPSTREAM,
	DOWNSTREAM
}

/**
 * Same as DataSource except data can flow in both directions
 */
export class DuplexDataSource<T> implements GenericDataSource<T> {
	/**
	 * The current value of this data source, can be changed through update
	 */
	public value: T;
	private primed: boolean;

	private updatingUpstream: boolean;
	private updatingDownstream: boolean;
	private updateDownstreamEvent: EventEmitter<T>;
	private updateUpstreamEvent: EventEmitter<T>;
	private propagateWritesToReadStream: boolean;
	public name: string;

	/**
	 *
	 * @param initialValue
	 * @param propagateWritesToReadStream If a write is done propagate this update back down to all the consumers. Useful at the root node
	 */
	constructor(initialValue?: T, propagateWritesToReadStream: boolean = true, name: string = 'RootDuplexDataSource') {
		this.name = name;
		this.value = initialValue;
		this.primed = initialValue !== undefined;
		this.updateDownstreamEvent = new EventEmitter();
		this.updateUpstreamEvent = new EventEmitter();
		this.propagateWritesToReadStream = propagateWritesToReadStream;
	}

	/**
	 * Makes it possible to have 2 completely separate data flow pipelines for each direction
	 * @param downStream stream to pipe downstream data to
	 * @param upstream  stream to pipe upstream data to
	 */
	public static fromTwoDataSource<T>(
		downStream: DataSource<T>,
		upstream: DataSource<T>,
		initialValue?: T,
		propagateWritesToReadStream: boolean = true
	): DuplexDataSource<T> {
		const result = new DuplexDataSource<T>(initialValue, propagateWritesToReadStream);
		//@ts-ignore
		result.updateDownstreamEvent = downStream.updateEvent;
		//@ts-ignore
		result.updateUpstreamEvent = upstream.updateEvent;

		return result;
	}

	/**
	 * Updates the data source with a value if it has never had a value before
	 */
	public withInitial(value: T): this {
		if (!this.primed) {
			this.updateDownstream(value);
		}

		return this;
	}

	/**
	 * Allows creating a duplex stream that blocks data in one direction. Useful for plugging into code that uses two way flow but only one way is desired
	 * @param direction direction of the dataflow that is allowed
	 */
	public static createOneWay<T>(direction: DataFlow = DataFlow.DOWNSTREAM, initialValue?: T): DuplexDataSource<T> {
		return new DuplexDataSource(initialValue, false).oneWayFlow(direction);
	}
	/**
	 * Updates the value in the data source and calls the listen callback for all listeners
	 * @param newValue new value for the data source
	 */
	public updateDownstream(newValue: T): void {
		if (this.updatingDownstream) {
			throw new Error(
				'Problem in datas source: Unstable value propagation, when updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed'
			);
		}
		this.primed = true;
		this.updatingDownstream = true;
		this.value = newValue;
		this.updateDownstreamEvent.fire(newValue);
		this.updatingDownstream = false;
	}

	/**
	 * Updates the value in the data source and calls the listen callback for all listeners
	 * @param newValue new value for the data source
	 */
	public updateUpstream(newValue: T): void {
		if (this.updatingUpstream) {
			throw new Error(
				'Problem in datas source: Unstable value propagation, when updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed'
			);
		}
		this.primed = true;
		this.updatingUpstream = true;
		this.value = newValue;
		this.updateUpstreamEvent.fire(newValue);
		if (this.propagateWritesToReadStream) {
			this.updateDownstreamEvent.fire(newValue);
		}
		this.updatingUpstream = false;
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
	 * alias for listenDownstream
	 * @param callback Callback to call when value is updated
	 * @param cancellationToken Optional token to control the cancellation of the subscription
	 * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
	 */
	public listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		return this.listenInternal(callback, cancellationToken);
	}

	private listenInternal(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateDownstreamEvent.subscribe(callback, cancellationToken).cancel;
	}

	/**
	 * Subscribes exclusively to updates of the data stream that occur due to an update flowing upstream
	 * @param callback Callback to call when value is updated
	 * @param cancellationToken Optional token to control the cancellation of the subscription
	 * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
	 */
	public listenUpstream(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateUpstreamEvent.subscribe(callback, cancellationToken).cancel;
	}

	/**
	 * Subscribes exclusively to one update of the data stream that occur due to an update flowing upstream
	 * @param callback Callback to call when value is updated
	 * @param cancellationToken Optional token to control the cancellation of the subscription
	 * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
	 */
	public listenUpstreamOnce(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateUpstreamEvent.subscribeOnce(callback, cancellationToken).cancel;
	}

	/**
	 * Subscribes exclusively to updates of the data stream that occur due to an update flowing downstream
	 * @param callback Callback to call when value is updated
	 * @param cancellationToken Optional token to control the cancellation of the subscription
	 * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
	 */
	public listenDownstream(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateDownstreamEvent.subscribe(callback, cancellationToken).cancel;
	}

	public downStreamToDataSource(cancellationToken?: CancellationToken): DataSource<T> {
		const downStreamDatasource = new DataSource<T>(this.value);
		this.listenDownstream((newVal) => {
			downStreamDatasource.update(newVal);
		}, cancellationToken);

		return downStreamDatasource;
	}

	/**
	 * Combines two sources into a third source that listens to updates from both parent sources.
	 * @param otherSource Second parent for the new source
	 * @param combinator Method allowing you to combine the data from both parents on update. Called each time a parent is updated with the latest values of both parents
	 * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
	 */
	public aggregate<D, E>(otherSource: ReadOnlyDataSource<D>, combinator: (self: T, other: D) => E, cancellationToken?: CancellationToken): DataSource<E> {
		cancellationToken = cancellationToken ?? new CancellationToken();
		const aggregatedSource = new DataSource<E>(combinator(this.value, otherSource.value));

		this.listen(() => aggregatedSource.update(combinator(this.value, otherSource.value)), cancellationToken);
		otherSource.listen(() => aggregatedSource.update(combinator(this.value, otherSource.value)), cancellationToken);

		return aggregatedSource;
	}

	/**
	 * Combines three sources into a fourth source that listens to updates from all parent sources.
	 * @param second Second parent for the new source
	 * @param third Third parent for the new source
	 * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
	 * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
	 */
	public aggregateThree<D, E, F>(
		second: ReadOnlyDataSource<D>,
		third: ReadOnlyDataSource<E>,
		combinator: (self: T, second: D, third: E) => F,
		cancellationToken?: CancellationToken
	): DataSource<F> {
		cancellationToken = cancellationToken ?? new CancellationToken();
		const aggregatedSource = new DataSource<F>(combinator(this.value, second.value, third.value));

		this.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value)), cancellationToken);
		second.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value)), cancellationToken);
		third.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value)), cancellationToken);

		return aggregatedSource;
	}

	/**
	 * Combines four sources into a fifth source that listens to updates from all parent sources.
	 * @param second Second parent for the new source
	 * @param third Third parent for the new source
	 * @param fourth Fourth parent for the new source
	 * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
	 * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
	 */
	public aggregateFour<D, E, F, G>(
		second: ReadOnlyDataSource<D>,
		third: ReadOnlyDataSource<E>,
		fourth: ReadOnlyDataSource<F>,
		combinator: (self: T, second: D, third: E, fourth: F) => G,
		cancellationToken?: CancellationToken
	): DataSource<G> {
		cancellationToken = cancellationToken ?? new CancellationToken();
		const aggregatedSource = new DataSource<G>(combinator(this.value, second.value, third.value, fourth.value));

		this.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
		second.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
		third.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
		fourth.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);

		return aggregatedSource;
	}

	/**
	 * Creates a new datasource that listenes to updates of this datasource but only propagates the updates from this source if they pass a predicate check
	 * @param callback predicate check to decide if the update from the parent data source is passed down or not
	 * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
	 */
	public filter(downStreamFilter: (value: T, oldValue: T) => boolean, cancellationToken?: CancellationToken): DataSource<T>;
	public filter(
		downStreamFilter: (value: T, oldValue: T) => boolean,
		upstreamFilter?: (value: T) => boolean,
		cancellationToken?: CancellationToken
	): DuplexDataSource<T>;
	public filter(
		downStreamFilter: (value: T, oldValue: T) => boolean,
		upstreamFilter?: ((value: T, oldValue: T) => boolean) | CancellationToken,
		cancellationToken?: CancellationToken
	): DuplexDataSource<T> | DataSource<T> {
		if (typeof upstreamFilter === 'function') {
			const filteredSource = new DuplexDataSource<T>(undefined, false);
			this.listenDownstream((newVal) => {
				if (downStreamFilter(newVal, filteredSource.value)) {
					filteredSource.updateDownstream(newVal);
				}
			}, cancellationToken);

			filteredSource.listenUpstream((newVal) => {
				if ((upstreamFilter as any)(newVal, this.value)) {
					this.updateUpstream(newVal);
				}
			}, cancellationToken);

			return filteredSource;
		} else {
			const filteredSource = new DataSource<T>();
			this.listenDownstream((newVal) => {
				if (downStreamFilter(newVal, filteredSource.value)) {
					filteredSource.update(newVal);
				}
			}, upstreamFilter as any);

			return filteredSource;
		}
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
		(this.primed ? this.listenAndRepeat : this.listen).call(this, processTransform<T, K>(operations as any, result), token);

		return result;
	}

	/**
	 * Forwards all updates from this source to another
	 * @param targetDataSource datasource to pipe the updates to
	 * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
	 */
	public pipe(targetDataSource: DuplexDataSource<T>, cancellationToken?: CancellationToken): this {
		this.listenDownstream((newVal) => targetDataSource.updateDownstream(newVal), cancellationToken);
		targetDataSource.listenUpstream((newVal) => this.updateUpstream(newVal), cancellationToken);
		return this;
	}

	/**
	 * Creates a new datasource that is listening to updates from this datasource and transforms them with a mapper function before fowarding them to itself
	 * @param mapper mapper function that transforms the data when it flows downwards
	 * @param reverseMapper mapper function that transforms the data when it flows upwards
	 * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
	 */
	public map<D>(mapper: (value: T) => D, cancellationToken?: CancellationToken): DataSource<D>;
	public map<D>(mapper: (value: T) => D, reverseMapper: (value: D) => T, cancellationToken?: CancellationToken): DuplexDataSource<D>;
	public map<D>(
		mapper: (value: T) => D,
		reverseMapper?: ((value: D) => T) | CancellationToken,
		cancellationToken?: CancellationToken
	): DataSource<D> | DuplexDataSource<D> {
		if (typeof reverseMapper === 'function') {
			let mappedSource;
			if (this.primed) {
				mappedSource = new DuplexDataSource<D>(mapper(this.value), false);
			} else {
				mappedSource = new DuplexDataSource<D>(undefined, false);
			}

			this.listenDownstream((v) => mappedSource.updateDownstream(mapper(v)), cancellationToken);
			mappedSource.listenUpstream((v) => this.updateUpstream((reverseMapper as any)(v)), cancellationToken);

			return mappedSource;
		} else {
			let mappedSource;
			if (this.primed) {
				mappedSource = new DataSource<D>(mapper(this.value));
			} else {
				mappedSource = new DataSource<D>();
			}

			this.listenDownstream((v) => mappedSource.update(mapper(v)), reverseMapper as any);

			return mappedSource;
		}
	}

	public listenOnce(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateDownstreamEvent.subscribeOnce(callback, cancellationToken).cancel;
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

	public debounceUpstream(time: number, cancellationToken?: CancellationToken): DuplexDataSource<T> {
		const debouncedDataSource = new DuplexDataSource<T>(this.value);
		let timeout;

		debouncedDataSource.listenUpstream((v) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				this.updateUpstream(v);
			}, time);
		}, cancellationToken);

		this.listenDownstream((v) => {
			debouncedDataSource.updateDownstream(v);
		}, cancellationToken);

		return debouncedDataSource;
	}

	public debounceDownstream(time: number, cancellationToken?: CancellationToken): DuplexDataSource<T> {
		const debouncedDataSource = new DuplexDataSource<T>(this.value);
		let timeout;

		this.listenDownstream((v) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				debouncedDataSource.updateDownstream(v);
			}, time);
		}, cancellationToken);

		debouncedDataSource.listenUpstream((v) => {
			this.updateUpstream(v);
		}, cancellationToken);

		return debouncedDataSource;
	}

	/**
	 * Creates a new datasource that listens to this one and forwards updates if they are not the same as the last update
	 * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
	 */
	public unique(cancellationToken?: CancellationToken): DuplexDataSource<T> {
		const uniqueSource = new DuplexDataSource<T>(this.value, false);

		let upstreamValue = this.value;
		let downStreamValue = this.value;
		this.listenDownstream((v) => {
			if (downStreamValue !== v) {
				downStreamValue = v;
				uniqueSource.updateDownstream(v);
			}
		}, cancellationToken);

		uniqueSource.listenUpstream((v) => {
			if (upstreamValue !== v) {
				upstreamValue = v;
				this.updateUpstream(v);
			}
		}, cancellationToken);

		return uniqueSource;
	}

	/**
	 * Allows flow of data only in one direction
	 * @param direction direction of the dataflow that is allowed
	 * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
	 */
	public oneWayFlow(direction: DataFlow = DataFlow.DOWNSTREAM, cancellationToken?: CancellationToken): DuplexDataSource<T> {
		const oneWaySource = new DuplexDataSource(this.value, false);

		if (direction === DataFlow.DOWNSTREAM) {
			this.listenDownstream((v) => oneWaySource.updateDownstream(v), cancellationToken);
			oneWaySource.updateUpstream = () => void 0;
		} else {
			oneWaySource.listenUpstream((v) => this.updateUpstream(v));
			oneWaySource.updateDownstream = () => void 0;
		}

		return oneWaySource;
	}

	/**
	 * Creates a new datasource that listens to this source and combines all updates into a single value
	 * @param reducer  function that aggregates an update with the previous result of aggregation
	 * @param initialValue initial value given to the new source
	 * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
	 */
	public reduce(reducer: (p: T, c: T) => T, initialValue: T, cancellationToken?: CancellationToken): DataSource<T> {
		const reduceSource = new DataSource<T>(initialValue);
		this.listen((v) => reduceSource.update(reducer(reduceSource.value, v)), cancellationToken);

		return reduceSource;
	}

	/**
	 * Remove all listeners
	 */
	public cancelAll(): void {
		this.updateDownstreamEvent.cancelAll();
		this.updateUpstreamEvent.cancelAll();
	}

	public cancelAllDownstream(): void {
		this.updateDownstreamEvent.cancelAll();
	}

	public cancelAllUpstream(): void {
		this.updateUpstreamEvent.cancelAll();
	}
}
