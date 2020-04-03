import { CancellationToken } from '../utilities/cancellation_token';
import { Callback } from '../utilities/common';
import { EventEmitter } from '../utilities/event_emitter';
import { DataSource } from './data_source';

export enum DataFlow {
	UPSTREAM,
	DOWNSTREAM
}

/**
 * Same as DataSource except data can flow in both directions
 */
export class DuplexDataSource<T> {
	/**
	 * The current value of this data source, can be changed through update
	 */
	public value: T;

	private updating: boolean;
	private updateDownstreamEvent: EventEmitter<T>;
	private updateUpstreamEvent: EventEmitter<T>;

	constructor(initialValue?: T) {
		this.value = initialValue;
		this.updateDownstreamEvent = new EventEmitter();
		this.updateUpstreamEvent = new EventEmitter();
	}

	/**
	 * Makes it possible to have 2 completely separate data flow pipelines for each direction
	 * @param downStream stream to pipe downstream data to
	 * @param upstream  stream to pipe upstream data to
	 */
	public static fromTwoDataSource<T>(downStream: DataSource<T>, upstream: DataSource<T>, initialValue?: T) {
		const result = new DuplexDataSource<T>(initialValue);
		//@ts-ignore
		result.updateDownstreamEvent = downStream.updateEvent;
		//@ts-ignore
		result.updateUpstreamEvent = upstream.updateEvent;
	}

	/**
	 * Allows creating a duplex stream that blocks data in one direction. Useful for plugging into code that uses two way flow but only one way is desired
	 * @param direction direction of the dataflow that is allowed
	 */
	public static createOneWay<T>(direction: DataFlow = DataFlow.DOWNSTREAM, initialValue?: T): DuplexDataSource<T> {
		return new DuplexDataSource(initialValue).oneWayFlow(direction);
	}
	/**
	 * Updates the value in the data source and calls the listen callback for all listeners
	 * @param newValue new value for the data source
	 */
	public updateDownstream(newValue: T): void {
		if (this.updating) {
			throw new Error(
				'Problem in datas source: Unstable value propagation, when updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed'
			);
		}
		this.updating = true;
		this.value = newValue;
		this.updateDownstreamEvent.fire(newValue);
		this.updating = false;
	}

	/**
	 * Updates the value in the data source and calls the listen callback for all listeners
	 * @param newValue new value for the data source
	 */
	public updateUpstream(newValue: T): void {
		if (this.updating) {
			throw new Error(
				'Problem in datas source: Unstable value propagation, when updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed'
			);
		}
		this.updating = true;
		this.value = newValue;
		this.updateUpstreamEvent.fire(newValue);
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
		this.updateDownstreamEvent.subscribe(callback, cancellationToken).cancel;
		return this.updateUpstreamEvent.subscribe(callback, cancellationToken).cancel;
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
	 * Subscribes exclusively to updates of the data stream that occur due to an update flowing downstream
	 * @param callback Callback to call when value is updated
	 * @param cancellationToken Optional token to control the cancellation of the subscription
	 * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
	 */
	public listenDownstream(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void> {
		return this.updateDownstreamEvent.subscribe(callback, cancellationToken).cancel;
	}

	/**
	 * Creates a new datasource that listenes to updates of this datasource but only propagates the updates from this source if they pass a predicate check
	 * @param callback predicate check to decide if the update from the parent data source is passed down or not
	 * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
	 */
	public filter(downStreamFilter: (value: T) => boolean, upstreamFilter?: (value: T) => boolean, cancellationToken?: CancellationToken): DuplexDataSource<T> {
		if (!upstreamFilter) {
			upstreamFilter = downStreamFilter;
		}

		const filteredSource = new DuplexDataSource<T>();
		this.listenDownstream((newVal) => {
			if (downStreamFilter(newVal)) {
				filteredSource.updateDownstream(newVal);
			}
		}, cancellationToken);

		filteredSource.listenUpstream((newVal) => {
			if ((upstreamFilter ?? downStreamFilter)(newVal)) {
				this.updateUpstream(newVal);
			}
		}, cancellationToken);

		return filteredSource;
	}

	/**
	 * Forwards all updates from this source to another
	 * @param targetDataSource datasource to pipe the updates to
	 * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
	 */
	public pipe(targetDataSource: DuplexDataSource<T>, cancellationToken?: CancellationToken): void {
		this.listenDownstream((newVal) => targetDataSource.updateDownstream(newVal), cancellationToken);
		targetDataSource.listenUpstream((newVal) => this.updateUpstream(newVal), cancellationToken);
	}

	/**
	 * Creates a new datasource that is listening to updates from this datasource and transforms them with a mapper function before fowarding them to itself
	 * @param mapper mapper function that transforms the data when it flows downwards
	 * @param reverseMapper mapper function that transforms the data when it flows upwards
	 * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
	 */
	public map<D>(mapper: (value: T) => D, reverseMapper: (value: D) => T, cancellationToken?: CancellationToken): DuplexDataSource<D> {
		const mappedSource = new DuplexDataSource<D>(mapper(this.value));

		this.listenDownstream((v) => mappedSource.updateDownstream(mapper(v)), cancellationToken);
		mappedSource.listenUpstream((v) => this.updateUpstream(reverseMapper(v)), cancellationToken);

		return mappedSource;
	}

	/**
	 * Creates a new datasource that listens to this one and forwards updates if they are not the same as the last update
	 * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
	 */
	public unique(cancellationToken?: CancellationToken): DuplexDataSource<T> {
		const uniqueSource = new DuplexDataSource<T>(this.value);

		this.listenDownstream((v) => {
			if (uniqueSource.value !== v) {
				uniqueSource.updateDownstream(v);
			}
		}, cancellationToken);

		uniqueSource.listenUpstream((v) => {
			if (this.value !== v) {
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
		const oneWaySource = new DuplexDataSource(this.value);

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
	 * Remove all listeners
	 */
	public cancelAll(): void {
		this.updateDownstreamEvent.cancelAll();
		this.updateUpstreamEvent.cancelAll();
	}
}
