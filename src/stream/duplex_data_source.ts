import { AurumServerInfo, syncDuplexDataSource } from '../aurum_server/aurum_server_client';
import { CancellationToken } from '../utilities/cancellation_token';
import { Callback } from '../utilities/common';
import { EventEmitter } from '../utilities/event_emitter';
import { DataSource, GenericDataSource, processTransform, ReadOnlyDataSource } from './data_source';
import { DataFlow, ddsOneWayFlow } from './duplex_data_source_operators';
import {
	DataSourceOperator,
	DuplexDataSourceDelayFilterOperator,
	DuplexDataSourceFilterOperator,
	DuplexDataSourceMapDelayFilterOperator,
	DuplexDataSourceMapOperator,
	DuplexDataSourceOperator,
	OperationType
} from './operator_model';

/**
 * Same as DataSource except data can flow in both directions
 */
export class DuplexDataSource<T> implements GenericDataSource<T> {
	/**
	 * The current value of this data source, can be changed through update
	 */
	public value: T;
	private primed: boolean;

	protected errorHandler: (error: any) => T;
	protected errorEvent: EventEmitter<Error>;
	private updatingUpstream: boolean;
	private updatingDownstream: boolean;
	private updateDownstreamEvent: EventEmitter<T>;
	private updateUpstreamEvent: EventEmitter<T>;
	private propagateWritesToReadStream: boolean;
	public name: string;

	/**
	 *
	 * @param initialValue
	 * @param rootNode If a write is done propagate this update back down to all the consumers. Useful at the root node
	 */
	constructor(initialValue?: T, rootNode: boolean = true, name: string = 'RootDuplexDataSource') {
		this.name = name;
		this.value = initialValue;
		this.primed = initialValue !== undefined;
		this.updateDownstreamEvent = new EventEmitter();
		this.updateUpstreamEvent = new EventEmitter();
		this.propagateWritesToReadStream = rootNode;
	}

	/**
	 * Connects to an aurum-server exposed datasource view https://github.com/CyberPhoenix90/aurum-server for more information
	 * Note that type safety is not guaranteed. Whatever the server sends as an update will be propagated
	 * @param  {AurumServerInfo} aurumServerInfo
	 * @returns DataSource
	 */
	public static fromRemoteSource<T>(aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): DuplexDataSource<T> {
		const result = new DuplexDataSource<T>(undefined, false);

		syncDuplexDataSource(result, aurumServerInfo, cancellation);

		return result;
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
		return new DuplexDataSource(initialValue, false).transformDuplex(ddsOneWayFlow(direction));
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
		if (this.primed) {
			callback(this.value);
		}
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
	 * Subscribes exclusively to updates of the data stream that occur due to an update flowing upstream
	 * @param callback Callback to call when value is updated
	 * @param cancellationToken Optional token to control the cancellation of the subscription
	 * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
	 */
	public listenUpstreamAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		if (this.primed) {
			callback(this.value);
		}

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

	public transformDuplex<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, I = H, J = I, K = J>(
		operationA: DuplexDataSourceOperator<T, A>,
		operationB?: DuplexDataSourceOperator<A, B> | CancellationToken,
		operationC?: DuplexDataSourceOperator<B, C> | CancellationToken,
		operationD?: DuplexDataSourceOperator<C, D> | CancellationToken,
		operationE?: DuplexDataSourceOperator<D, E> | CancellationToken,
		operationF?: DuplexDataSourceOperator<E, F> | CancellationToken,
		operationG?: DuplexDataSourceOperator<F, G> | CancellationToken,
		operationH?: DuplexDataSourceOperator<G, H> | CancellationToken,
		operationI?: DuplexDataSourceOperator<H, I> | CancellationToken,
		operationJ?: DuplexDataSourceOperator<I, J> | CancellationToken,
		operationK?: DuplexDataSourceOperator<J, K> | CancellationToken,
		cancellationToken?: CancellationToken
	): DuplexDataSource<K> {
		let token;
		const operations: DuplexDataSourceOperator<any, any>[] = [
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
		].filter((e) => e && (e instanceof CancellationToken ? ((token = e), false) : true)) as DuplexDataSourceOperator<any, any>[];
		if (cancellationToken) {
			token = cancellationToken;
		}
		const result = new DuplexDataSource<K>(undefined, false, this.name + ' ' + operations.map((v) => v.name).join(' '));
		(this.primed ? this.listenAndRepeat : this.listen).call(this, processTransformDuplex<T, K>(operations as any, result, DataFlow.DOWNSTREAM), token);
		result.listenUpstream.call(result, processTransformDuplex<T, K>(operations as any, this as any, DataFlow.UPSTREAM), token);

		return result;
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

	public emitError(e: Error, direction: DataFlow): void {
		if (this.errorHandler) {
			try {
				if (direction === DataFlow.DOWNSTREAM) {
					return this.updateDownstream(this.errorHandler(e));
				} else {
					return this.updateUpstream(this.errorHandler(e));
				}
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
}

export function processTransformDuplex<I, O>(operations: DuplexDataSourceOperator<any, any>[], result: DuplexDataSource<O>, direction: DataFlow): Callback<I> {
	return async (v: any) => {
		try {
			for (const operation of operations) {
				switch (operation.operationType) {
					case OperationType.NOOP:
					case OperationType.MAP:
						v =
							direction === DataFlow.DOWNSTREAM
								? (operation as DuplexDataSourceMapOperator<any, any>).operationDown(v)
								: (operation as DuplexDataSourceMapOperator<any, any>).operationUp(v);
						break;
					case OperationType.MAP_DELAY_FILTER:
						const tmp =
							direction === DataFlow.DOWNSTREAM
								? await (operation as DuplexDataSourceMapDelayFilterOperator<any, any>).operationDown(v)
								: await (operation as DuplexDataSourceMapDelayFilterOperator<any, any>).operationUp(v);
						if (tmp.cancelled) {
							return;
						} else {
							v = await tmp.item;
						}
						break;
					case OperationType.DELAY:
					case OperationType.MAP_DELAY:
						v =
							direction === DataFlow.DOWNSTREAM
								? await (operation as DuplexDataSourceMapOperator<any, any>).operationDown(v)
								: await (operation as DuplexDataSourceMapOperator<any, any>).operationUp(v);
						break;
					case OperationType.DELAY_FILTER:
						if (
							!(direction === DataFlow.DOWNSTREAM
								? await (operation as DuplexDataSourceDelayFilterOperator<any>).operationDown(v)
								: await (operation as DuplexDataSourceDelayFilterOperator<any>).operationUp(v))
						) {
							return;
						}
						break;
					case OperationType.FILTER:
						if (
							!(direction === DataFlow.DOWNSTREAM
								? (operation as DuplexDataSourceFilterOperator<any>).operationDown(v)
								: (operation as DuplexDataSourceFilterOperator<any>).operationUp(v))
						) {
							return;
						}
						break;
				}
			}
			if (direction === DataFlow.DOWNSTREAM) {
				result.updateDownstream(v);
			} else {
				result.updateUpstream(v);
			}
		} catch (e) {
			result.emitError(e, direction);
		}
	};
}
