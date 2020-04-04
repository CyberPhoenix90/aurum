import { CancellationToken } from '../utilities/cancellation_token';
import { Callback } from '../utilities/common';
import { DataSource } from './data_source';
export declare enum DataFlow {
    UPSTREAM = 0,
    DOWNSTREAM = 1
}
/**
 * Same as DataSource except data can flow in both directions
 */
export declare class DuplexDataSource<T> {
    /**
     * The current value of this data source, can be changed through update
     */
    value: T;
    private updating;
    private updateDownstreamEvent;
    private updateUpstreamEvent;
    constructor(initialValue?: T);
    /**
     * Makes it possible to have 2 completely separate data flow pipelines for each direction
     * @param downStream stream to pipe downstream data to
     * @param upstream  stream to pipe upstream data to
     */
    static fromTwoDataSource<T>(downStream: DataSource<T>, upstream: DataSource<T>, initialValue?: T): void;
    /**
     * Allows creating a duplex stream that blocks data in one direction. Useful for plugging into code that uses two way flow but only one way is desired
     * @param direction direction of the dataflow that is allowed
     */
    static createOneWay<T>(direction?: DataFlow, initialValue?: T): DuplexDataSource<T>;
    /**
     * Updates the value in the data source and calls the listen callback for all listeners
     * @param newValue new value for the data source
     */
    updateDownstream(newValue: T): void;
    /**
     * Updates the value in the data source and calls the listen callback for all listeners
     * @param newValue new value for the data source
     */
    updateUpstream(newValue: T): void;
    /**
     * Same as listen but will immediately call the callback with the current value first
     * @param callback Callback to call when value is updated
     * @param cancellationToken Optional token to control the cancellation of the subscription
     * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
     */
    listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    /**
     * Subscribes to the updates of the data stream
     * @param callback Callback to call when value is updated
     * @param cancellationToken Optional token to control the cancellation of the subscription
     * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
     */
    listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    /**
     * Subscribes exclusively to updates of the data stream that occur due to an update flowing upstream
     * @param callback Callback to call when value is updated
     * @param cancellationToken Optional token to control the cancellation of the subscription
     * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
     */
    listenUpstream(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    /**
     * Subscribes exclusively to updates of the data stream that occur due to an update flowing downstream
     * @param callback Callback to call when value is updated
     * @param cancellationToken Optional token to control the cancellation of the subscription
     * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
     */
    listenDownstream(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    /**
     * Creates a new datasource that listenes to updates of this datasource but only propagates the updates from this source if they pass a predicate check
     * @param callback predicate check to decide if the update from the parent data source is passed down or not
     * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
     */
    filter(downStreamFilter: (value: T) => boolean, upstreamFilter?: (value: T) => boolean, cancellationToken?: CancellationToken): DuplexDataSource<T>;
    /**
     * Forwards all updates from this source to another
     * @param targetDataSource datasource to pipe the updates to
     * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
     */
    pipe(targetDataSource: DuplexDataSource<T>, cancellationToken?: CancellationToken): void;
    /**
     * Creates a new datasource that is listening to updates from this datasource and transforms them with a mapper function before fowarding them to itself
     * @param mapper mapper function that transforms the data when it flows downwards
     * @param reverseMapper mapper function that transforms the data when it flows upwards
     * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
     */
    map<D>(mapper: (value: T) => D, reverseMapper: (value: D) => T, cancellationToken?: CancellationToken): DuplexDataSource<D>;
    /**
     * Creates a new datasource that listens to this one and forwards updates if they are not the same as the last update
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    unique(cancellationToken?: CancellationToken): DuplexDataSource<T>;
    /**
     * Allows flow of data only in one direction
     * @param direction direction of the dataflow that is allowed
     * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
     */
    oneWayFlow(direction?: DataFlow, cancellationToken?: CancellationToken): DuplexDataSource<T>;
    /**
     * Remove all listeners
     */
    cancelAll(): void;
}
//# sourceMappingURL=duplex_data_source.d.ts.map