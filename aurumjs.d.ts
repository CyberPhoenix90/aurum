declare module "stream/operator_model" {
    export enum OperationType {
        FILTER = 0,
        NOOP = 1,
        MAP = 2,
        DELAY = 3,
        MAP_DELAY = 4,
        DELAY_FILTER = 5,
        MAP_DELAY_FILTER = 6
    }
    export interface DataSourceOperator<T, M> {
        operationType: OperationType;
        typescriptLimitationWorkaround?: (value: T) => M;
        name: string;
    }
    export interface DataSourceFilterOperator<T> extends DataSourceOperator<T, T> {
        operationType: OperationType.FILTER;
        operation: (value: T) => boolean;
    }
    export interface DataSourceMapOperator<T, M> extends DataSourceOperator<T, M> {
        operationType: OperationType.MAP;
        operation: (value: T) => M;
    }
    export interface DataSourceNoopOperator<T> extends DataSourceOperator<T, T> {
        operationType: OperationType.NOOP;
        operation: (value: T) => T;
    }
    export interface DataSourceDelayOperator<T> extends DataSourceOperator<T, T> {
        operationType: OperationType.DELAY;
        operation: (value: T) => Promise<T>;
    }
    export interface DataSourceMapDelayOperator<T, M> extends DataSourceOperator<T, M> {
        operationType: OperationType.MAP_DELAY;
        operation: (value: T) => Promise<M>;
    }
    export interface DataSourceMapDelayFilterOperator<T, M> extends DataSourceOperator<T, M> {
        operationType: OperationType.MAP_DELAY_FILTER;
        operation: (value: T) => Promise<{
            item: M;
            cancelled: boolean;
        }>;
    }
    export interface DataSourceDelayFilterOperator<T> extends DataSourceOperator<T, T> {
        operationType: OperationType.DELAY_FILTER;
        operation: (value: T) => Promise<boolean>;
    }
}
declare module "stream/duplex_data_source" {
    import { CancellationToken } from "utilities/cancellation_token";
    import { Callback } from "utilities/common";
    import { DataSource, GenericDataSource, ReadOnlyDataSource } from "stream/data_source";
    import { DataSourceOperator } from "stream/operator_model";
    export enum DataFlow {
        UPSTREAM = 0,
        DOWNSTREAM = 1
    }
    /**
     * Same as DataSource except data can flow in both directions
     */
    export class DuplexDataSource<T> implements GenericDataSource<T> {
        /**
         * The current value of this data source, can be changed through update
         */
        value: T;
        private primed;
        private updatingUpstream;
        private updatingDownstream;
        private updateDownstreamEvent;
        private updateUpstreamEvent;
        private propagateWritesToReadStream;
        name: string;
        /**
         *
         * @param initialValue
         * @param propagateWritesToReadStream If a write is done propagate this update back down to all the consumers. Useful at the root node
         */
        constructor(initialValue?: T, propagateWritesToReadStream?: boolean, name?: string);
        /**
         * Makes it possible to have 2 completely separate data flow pipelines for each direction
         * @param downStream stream to pipe downstream data to
         * @param upstream  stream to pipe upstream data to
         */
        static fromTwoDataSource<T>(downStream: DataSource<T>, upstream: DataSource<T>, initialValue?: T, propagateWritesToReadStream?: boolean): DuplexDataSource<T>;
        /**
         * Updates the data source with a value if it has never had a value before
         */
        withInitial(value: T): this;
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
         * alias for listenDownstream
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        private listenInternal;
        /**
         * Subscribes exclusively to updates of the data stream that occur due to an update flowing upstream
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listenUpstream(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Subscribes exclusively to one update of the data stream that occur due to an update flowing upstream
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listenUpstreamOnce(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Subscribes exclusively to updates of the data stream that occur due to an update flowing downstream
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listenDownstream(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        downStreamToDataSource(cancellationToken?: CancellationToken): DataSource<T>;
        /**
         * Combines two sources into a third source that listens to updates from both parent sources.
         * @param otherSource Second parent for the new source
         * @param combinator Method allowing you to combine the data from both parents on update. Called each time a parent is updated with the latest values of both parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
         */
        aggregate<D, E>(otherSource: ReadOnlyDataSource<D>, combinator: (self: T, other: D) => E, cancellationToken?: CancellationToken): DataSource<E>;
        /**
         * Combines three sources into a fourth source that listens to updates from all parent sources.
         * @param second Second parent for the new source
         * @param third Third parent for the new source
         * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
         */
        aggregateThree<D, E, F>(second: ReadOnlyDataSource<D>, third: ReadOnlyDataSource<E>, combinator: (self: T, second: D, third: E) => F, cancellationToken?: CancellationToken): DataSource<F>;
        /**
         * Combines four sources into a fifth source that listens to updates from all parent sources.
         * @param second Second parent for the new source
         * @param third Third parent for the new source
         * @param fourth Fourth parent for the new source
         * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
         */
        aggregateFour<D, E, F, G>(second: ReadOnlyDataSource<D>, third: ReadOnlyDataSource<E>, fourth: ReadOnlyDataSource<F>, combinator: (self: T, second: D, third: E, fourth: F) => G, cancellationToken?: CancellationToken): DataSource<G>;
        /**
         * Creates a new datasource that listenes to updates of this datasource but only propagates the updates from this source if they pass a predicate check
         * @param callback predicate check to decide if the update from the parent data source is passed down or not
         * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
         */
        filter(downStreamFilter: (value: T, oldValue: T) => boolean, cancellationToken?: CancellationToken): DataSource<T>;
        filter(downStreamFilter: (value: T, oldValue: T) => boolean, upstreamFilter?: (value: T) => boolean, cancellationToken?: CancellationToken): DuplexDataSource<T>;
        transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, I = H, J = I, K = J>(operationA: DataSourceOperator<T, A>, operationB?: DataSourceOperator<A, B> | CancellationToken, operationC?: DataSourceOperator<B, C> | CancellationToken, operationD?: DataSourceOperator<C, D> | CancellationToken, operationE?: DataSourceOperator<D, E> | CancellationToken, operationF?: DataSourceOperator<E, F> | CancellationToken, operationG?: DataSourceOperator<F, G> | CancellationToken, operationH?: DataSourceOperator<G, H> | CancellationToken, operationI?: DataSourceOperator<H, I> | CancellationToken, operationJ?: DataSourceOperator<I, J> | CancellationToken, operationK?: DataSourceOperator<J, K> | CancellationToken, cancellationToken?: CancellationToken): DataSource<K>;
        /**
         * Forwards all updates from this source to another
         * @param targetDataSource datasource to pipe the updates to
         * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
         */
        pipe(targetDataSource: DuplexDataSource<T>, cancellationToken?: CancellationToken): this;
        /**
         * Creates a new datasource that is listening to updates from this datasource and transforms them with a mapper function before fowarding them to itself
         * @param mapper mapper function that transforms the data when it flows downwards
         * @param reverseMapper mapper function that transforms the data when it flows upwards
         * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
         */
        map<D>(mapper: (value: T) => D, cancellationToken?: CancellationToken): DataSource<D>;
        map<D>(mapper: (value: T) => D, reverseMapper: (value: D) => T, cancellationToken?: CancellationToken): DuplexDataSource<D>;
        listenOnce(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Returns a promise that resolves when the next update occurs
         * @param cancellationToken
         */
        awaitNextUpdate(cancellationToken?: CancellationToken): Promise<T>;
        debounceUpstream(time: number, cancellationToken?: CancellationToken): DuplexDataSource<T>;
        debounceDownstream(time: number, cancellationToken?: CancellationToken): DuplexDataSource<T>;
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
         * Creates a new datasource that listens to this source and combines all updates into a single value
         * @param reducer  function that aggregates an update with the previous result of aggregation
         * @param initialValue initial value given to the new source
         * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
         */
        reduce(reducer: (p: T, c: T) => T, initialValue: T, cancellationToken?: CancellationToken): DataSource<T>;
        /**
         * Remove all listeners
         */
        cancelAll(): void;
    }
}
declare module "utilities/common" {
    import { DataSource, ReadOnlyDataSource } from "stream/data_source";
    import { DuplexDataSource } from "stream/duplex_data_source";
    export type AttributeValue = string | ReadOnlyDataSource<string> | ReadOnlyDataSource<boolean> | boolean;
    export type StringSource = string | ReadOnlyDataSource<string>;
    export type ClassType = string | ReadOnlyDataSource<string> | ReadOnlyDataSource<string[]> | Array<string | ReadOnlyDataSource<string>>;
    /**
     * Type alias for a generic calback taking a parameter and not returning anything
     */
    export type Callback<T> = (data?: T) => void;
    export type Delegate = () => void;
    export type Predicate<T> = (data: T) => boolean;
    export type Provider<T> = () => T;
    export type Comparator<T1, T2> = (value1: T1, value2: T2) => boolean;
    export type Constructor<T> = new (...args: any[]) => T;
    export type MapLike<T> = {
        [key: string]: T;
    };
    export type DataDrain<T> = Callback<T> | DataSource<T> | DuplexDataSource<T>;
    export type ThenArg<T> = T extends any ? any : T extends PromiseLike<infer U> ? U : T;
}
declare module "utilities/cancellation_token" {
    import { Delegate, Callback } from "utilities/common";
    export class CancellationToken {
        private cancelables;
        private _isCancelled;
        get isCanceled(): boolean;
        constructor(...cancellables: Delegate[]);
        hasCancellables(): boolean;
        /**
         * Attaches a new cancelable to this token
         * @param delegate
         */
        addCancelable(delegate: Delegate): this;
        removeCancelable(delegate: Delegate): this;
        setTimeout(cb: Delegate, time?: number): void;
        setInterval(cb: Delegate, time: number): void;
        requestAnimationFrame(cb: Callback<number>): void;
        animationLoop(cb: Callback<number>): void;
        throwIfCancelled(msg: string): void;
        chain(target: CancellationToken, twoWays?: boolean): CancellationToken;
        /**
         * Registers an event using addEventListener and if you cancel the token the event will be canceled as well
         */
        registerDomEvent(eventEmitter: HTMLElement | Document | Window, event: string, callback: (e: Event) => void): this;
        /**
         * Cancels everything attached to this token
         */
        cancel(): void;
    }
}
declare module "utilities/event_emitter" {
    import { CancellationToken } from "utilities/cancellation_token";
    import { Callback } from "utilities/common";
    /**
     * @internal
     */
    export interface EventSubscriptionFacade {
        cancel(): void;
    }
    /**
     * @internal
     */
    export type EventCallback<T> = (data: T) => void;
    /**
     * @internal
     */
    export class EventEmitter<T> {
        private isFiring;
        private onAfterFire;
        onEmpty: Callback<void>;
        private static leakWarningThreshold;
        static setSubscriptionLeakWarningThreshold(limit: number): void;
        get subscriptions(): number;
        private subscribeChannel;
        private subscribeOnceChannel;
        constructor();
        subscribe(callback: EventCallback<T>, cancellationToken?: CancellationToken): EventSubscriptionFacade;
        subscribeOnce(callback: import("utilities/common").Callback<T>, cancellationToken?: CancellationToken): EventSubscriptionFacade;
        hasSubscriptions(): boolean;
        cancelAll(): void;
        private afterFire;
        fire(data?: T): void;
        private createSubscription;
        private cancel;
    }
}
declare module "debug_mode" {
    import { DataSource } from "stream/data_source";
    import { EventEmitter } from "utilities/event_emitter";
    export let debugMode: boolean;
    global {
        interface Window {
            __debugUpdates: EventEmitter<{
                source: SerializedStreamData;
                newValue: any;
                stack: string;
            }>;
            __debugNewSource: EventEmitter<{
                source: SerializedStreamData;
            }>;
            __debugLinked: EventEmitter<{
                parent: SerializedStreamData;
                child: SerializedStreamData;
            }>;
            __debugUnlinked: EventEmitter<{
                parent: SerializedStreamData;
                child: SerializedStreamData;
            }>;
            __debugGetStreamData: () => SerializedStreamData[];
        }
    }
    /**
     * Initializes the debug features of aurum. Required for the use of aurum devtools
     * Run this function before creating any streams or any aurum components for best results
     * Enabling this harms performance and breaks backwards compatibility with some browsers
     * Do not enable in production
     */
    export function enableDebugMode(): void;
    export function debugRegisterStream(stream: DataSource<any>, stack: string): void;
    export function debugRegisterLink(parent: DataSource<any>, child: DataSource<any>): void;
    export function debugRegisterUnlink(parent: DataSource<any>, child: DataSource<any>): void;
    export function debugDeclareUpdate(source: DataSource<any>, value: any, stack: string): void;
    export function debugRegisterConsumer(stream: DataSource<any>, consumer: string, consumerStack: string): void;
    export type SerializedStreamData = Omit<StreamData, 'reference'>;
    export interface StreamData {
        name: string;
        id: number;
        value: any;
        reference: WeakRef<DataSource<any>>;
        parents: number[];
        stack: string;
        timestamp: number;
        children: number[];
        consumers: {
            code: string;
            stack: string;
        }[];
    }
    class WeakRef<T> {
        constructor(item: T);
        deref(): T | undefined;
    }
}
declare module "stream/stream" {
    import { DataSourceOperator } from "stream/operator_model";
    import { CancellationToken } from "utilities/cancellation_token";
    import { Callback } from "utilities/common";
    import { DataSource, ReadOnlyDataSource } from "stream/data_source";
    /**
     * Lets you logically combine 2 data sources so that update calls go through the input source and listen goes to the output source
     */
    export class Stream<I, O = I> implements ReadOnlyDataSource<O> {
        private input;
        private output;
        get name(): string;
        /**
         * The current value of this data source, can be changed through update
         */
        get value(): O;
        private constructor();
        static fromFetchRaw(url: string): Stream<void | RequestInit, Promise<Response>>;
        static fromPreconnectedSources<I, O>(inputSource?: DataSource<I>, outputSource?: DataSource<O>): Stream<I, O>;
        static fromStreamTransformation<I, O>(callback: (data: DataSource<I>) => DataSource<O>): Stream<I, O>;
        static fromFetchPostJson<I, O>(url: string, baseRequestData?: RequestInit): Stream<I, O>;
        static fromFetchGetJson<O>(url: string, baseRequestData?: RequestInit): Stream<void, O>;
        update(data: I): void;
        transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, Z = H, J = Z, K = J>(operationA: DataSourceOperator<O, A>, operationB?: DataSourceOperator<A, B> | CancellationToken, operationC?: DataSourceOperator<B, C> | CancellationToken, operationD?: DataSourceOperator<C, D> | CancellationToken, operationE?: DataSourceOperator<D, E> | CancellationToken, operationF?: DataSourceOperator<E, F> | CancellationToken, operationG?: DataSourceOperator<F, G> | CancellationToken, operationH?: DataSourceOperator<G, H> | CancellationToken, operationI?: DataSourceOperator<H, Z> | CancellationToken, operationJ?: DataSourceOperator<Z, J> | CancellationToken, operationK?: DataSourceOperator<J, K> | CancellationToken, cancellationToken?: CancellationToken): Stream<I, K>;
        getOutput(): DataSource<O>;
        listen(callback: Callback<O>, cancellationToken?: CancellationToken): Callback<void>;
        listenAndRepeat(callback: Callback<O>, cancellationToken?: CancellationToken): Callback<void>;
        listenOnce(callback: Callback<O>, cancellationToken?: CancellationToken): Callback<void>;
        awaitNextUpdate(cancellationToken?: CancellationToken): Promise<O>;
        cancelAll(): void;
    }
}
declare module "stream/data_source" {
    import { CancellationToken } from "utilities/cancellation_token";
    import { Callback, Predicate } from "utilities/common";
    import { EventEmitter } from "utilities/event_emitter";
    import { DataSourceOperator } from "stream/operator_model";
    export interface ReadOnlyDataSource<T> {
        readonly value: T;
        readonly name: string;
        listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        listenOnce(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        awaitNextUpdate(cancellationToken?: CancellationToken): Promise<T>;
        transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, I = H, J = I, K = J>(operationA: DataSourceOperator<T, A>, operationB?: DataSourceOperator<A, B> | CancellationToken, operationC?: DataSourceOperator<B, C> | CancellationToken, operationD?: DataSourceOperator<C, D> | CancellationToken, operationE?: DataSourceOperator<D, E> | CancellationToken, operationF?: DataSourceOperator<E, F> | CancellationToken, operationG?: DataSourceOperator<F, G> | CancellationToken, operationH?: DataSourceOperator<G, H> | CancellationToken, operationI?: DataSourceOperator<H, I> | CancellationToken, operationJ?: DataSourceOperator<I, J> | CancellationToken, operationK?: DataSourceOperator<J, K> | CancellationToken, cancellationToken?: CancellationToken): ReadOnlyDataSource<K>;
    }
    export interface GenericDataSource<T> {
        readonly value: T;
        listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        listenOnce(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        awaitNextUpdate(cancellationToken?: CancellationToken): Promise<T>;
        withInitial(value: T): this;
        aggregate<D, E>(otherSource: ReadOnlyDataSource<D>, combinator: (self: T, other: D) => E, cancellationToken?: CancellationToken): GenericDataSource<E>;
        aggregateThree<D, E, F>(second: ReadOnlyDataSource<D>, third: ReadOnlyDataSource<E>, combinator: (self: T, second: D, third: E) => F, cancellationToken?: CancellationToken): GenericDataSource<F>;
        aggregateFour<D, E, F, G>(second: ReadOnlyDataSource<D>, third: ReadOnlyDataSource<E>, fourth: ReadOnlyDataSource<F>, combinator: (self: T, second: D, third: E, fourth: F) => G, cancellationToken?: CancellationToken): GenericDataSource<G>;
        transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, I = H, J = I, K = J>(operationA: DataSourceOperator<T, A>, operationB?: DataSourceOperator<A, B> | CancellationToken, operationC?: DataSourceOperator<B, C> | CancellationToken, operationD?: DataSourceOperator<C, D> | CancellationToken, operationE?: DataSourceOperator<D, E> | CancellationToken, operationF?: DataSourceOperator<E, F> | CancellationToken, operationG?: DataSourceOperator<F, G> | CancellationToken, operationH?: DataSourceOperator<G, H> | CancellationToken, operationI?: DataSourceOperator<H, I> | CancellationToken, operationJ?: DataSourceOperator<I, J> | CancellationToken, operationK?: DataSourceOperator<J, K> | CancellationToken, cancellationToken?: CancellationToken): DataSource<K>;
    }
    /**
     * Datasources wrap a value and allow you to update it in an observable way. Datasources can be manipulated like streams and can be bound directly in the JSX syntax and will update the html whenever the value changes
     */
    export class DataSource<T> implements GenericDataSource<T> {
        /**
         * The current value of this data source, can be changed through update
         */
        value: T;
        private primed;
        private updating;
        name: string;
        protected updateEvent: EventEmitter<T>;
        constructor(initialValue?: T, name?: string);
        static fromMultipleSources<T>(sources: ReadOnlyDataSource<T>[], cancellation?: CancellationToken): DataSource<T>;
        /**
         * Updates with the same value as the last value
         */
        repeatLast(): this;
        /**
         * Updates the value in the data source and calls the listen callback for all listeners
         * @param newValue new value for the data source
         */
        update(newValue: T): void;
        /**
         * Updates the data source with a value if it has never had a value before
         */
        withInitial(value: T): this;
        /**
         * Same as listen but will immediately call the callback with the current value first
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        private listenAndRepeatInternal;
        /**
         * Subscribes to the updates of the data stream
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        private listenInternal;
        /**
         * Subscribes to the updates of the data stream for a single update
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listenOnce(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
        transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, I = H, J = I, K = J>(operationA: DataSourceOperator<T, A>, operationB?: DataSourceOperator<A, B> | CancellationToken, operationC?: DataSourceOperator<B, C> | CancellationToken, operationD?: DataSourceOperator<C, D> | CancellationToken, operationE?: DataSourceOperator<D, E> | CancellationToken, operationF?: DataSourceOperator<E, F> | CancellationToken, operationG?: DataSourceOperator<F, G> | CancellationToken, operationH?: DataSourceOperator<G, H> | CancellationToken, operationI?: DataSourceOperator<H, I> | CancellationToken, operationJ?: DataSourceOperator<I, J> | CancellationToken, operationK?: DataSourceOperator<J, K> | CancellationToken, cancellationToken?: CancellationToken): DataSource<K>;
        /**
         * Combines two sources into a third source that listens to updates from both parent sources.
         * @param otherSource Second parent for the new source
         * @param combinator Method allowing you to combine the data from both parents on update. Called each time a parent is updated with the latest values of both parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
         */
        aggregate<D, E>(otherSource: ReadOnlyDataSource<D>, combinator: (self: T, other: D) => E, cancellationToken?: CancellationToken): DataSource<E>;
        /**
         * Combines three sources into a fourth source that listens to updates from all parent sources.
         * @param second Second parent for the new source
         * @param third Third parent for the new source
         * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
         */
        aggregateThree<D, E, F>(second: ReadOnlyDataSource<D>, third: ReadOnlyDataSource<E>, combinator: (self: T, second: D, third: E) => F, cancellationToken?: CancellationToken): DataSource<F>;
        /**
         * Combines four sources into a fifth source that listens to updates from all parent sources.
         * @param second Second parent for the new source
         * @param third Third parent for the new source
         * @param fourth Fourth parent for the new source
         * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
         */
        aggregateFour<D, E, F, G>(second: ReadOnlyDataSource<D>, third: ReadOnlyDataSource<E>, fourth: ReadOnlyDataSource<F>, combinator: (self: T, second: D, third: E, fourth: F) => G, cancellationToken?: CancellationToken): DataSource<G>;
        /**
         * Combines four sources into a fifth source that listens to updates from all parent sources.
         * @param second Second parent for the new source
         * @param third Third parent for the new source
         * @param fourth Fourth parent for the new source
         * @param fifth Fifth  parent for the new source
         * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
         */
        aggregateFive<D, E, F, G, H>(second: ReadOnlyDataSource<D>, third: ReadOnlyDataSource<E>, fourth: ReadOnlyDataSource<F>, fifth: ReadOnlyDataSource<G>, combinator: (self: T, second: D, third: E, fourth: F, fifth: G) => H, cancellationToken?: CancellationToken): DataSource<H>;
        /**
         * Forwards all updates from this source to another
         * @param targetDataSource datasource to pipe the updates to
         * @param cancellationToken  Cancellation token to cancel the subscription the target datasource has to this datasource
         */
        pipe(targetDataSource: DataSource<T>, cancellationToken?: CancellationToken): this;
        /**
         * Like aggregate except that no combination method is needed as a result both parents must have the same type and the new stream just exposes the last update recieved from either parent
         * @param otherSource Second parent for the new source
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
         */
        combine(otherSources: DataSource<T>[], cancellationToken?: CancellationToken): DataSource<T>;
        /**
         * Returns a promise that resolves when the next update occurs
         * @param cancellationToken
         */
        awaitNextUpdate(cancellationToken?: CancellationToken): Promise<T>;
        /**
         * Remove all listeners
         */
        cancelAll(): void;
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
        private lengthSource;
        private name;
        constructor(initialData?: T[], name?: string);
        static fromMultipleSources<T>(sources: Array<ArrayDataSource<T> | T[]>, cancellationToken?: CancellationToken): ArrayDataSource<T>;
        /**
         * Same as listen but will immediately call the callback with an append of all existing elements first
         */
        listenAndRepeat(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void>;
        repeatCurrentState(): void;
        listen(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void>;
        listenOnce(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Returns a promise that resolves when the next update occurs
         * @param cancellationToken
         */
        awaitNextUpdate(cancellationToken?: CancellationToken): Promise<CollectionChange<T>>;
        get length(): DataSource<number>;
        getData(): ReadonlyArray<T>;
        get(index: number): T;
        set(index: number, item: T): void;
        indexOf(item: T): number;
        lastIndexOf(item: T): number;
        includes(item: T): boolean;
        replace(item: T, newItem: T): void;
        swap(indexA: number, indexB: number): void;
        swapItems(itemA: T, itemB: T): void;
        appendArray(items: T[]): void;
        insertAt(index: number, ...items: T[]): void;
        push(...items: T[]): void;
        unshift(...items: T[]): void;
        pop(): T;
        merge(newData: T[]): void;
        removeRight(count: number): void;
        removeLeft(count: number): void;
        removeAt(index: number): void;
        removeRange(start: number, end: any): void;
        remove(item: T): void;
        clear(): void;
        shift(): T;
        toArray(): T[];
        reverse(cancellationToken?: CancellationToken): ReversedArrayView<T>;
        sort(comparator: (a: T, b: T) => number, dependencies?: ReadOnlyDataSource<any>[], cancellationToken?: CancellationToken): SortedArrayView<T>;
        map<D>(mapper: (data: T) => D, dependencies?: ReadOnlyDataSource<any>[], cancellationToken?: CancellationToken): MappedArrayView<T, D>;
        unique(cancellationToken?: CancellationToken): UniqueArrayView<T>;
        filter(callback: Predicate<T>, dependencies?: ReadOnlyDataSource<any>[], cancellationToken?: CancellationToken): FilteredArrayView<T>;
        forEach(callbackfn: (value: T, index: number, array: T[]) => void): void;
        protected update(change: CollectionChange<T>): void;
    }
    export class MappedArrayView<D, T> extends ArrayDataSource<T> {
        private parent;
        private mapper;
        constructor(parent: ArrayDataSource<D>, mapper: (a: D) => T, cancellationToken?: CancellationToken, name?: string);
        refresh(): void;
    }
    export class ReversedArrayView<T> extends ArrayDataSource<T> {
        private parent;
        constructor(parent: ArrayDataSource<T>, cancellationToken?: CancellationToken, name?: string);
        refresh(): void;
    }
    export class UniqueArrayView<T> extends ArrayDataSource<T> {
        constructor(parent: ArrayDataSource<T>, cancellationToken?: CancellationToken, name?: string);
    }
    export class SortedArrayView<T> extends ArrayDataSource<T> {
        private comparator;
        private parent;
        constructor(parent: ArrayDataSource<T>, comparator: (a: T, b: T) => number, cancellationToken?: CancellationToken, name?: string);
        private appendSorted;
        refresh(): void;
    }
    export class FilteredArrayView<T> extends ArrayDataSource<T> {
        private viewFilter;
        private parent;
        constructor(parent: ArrayDataSource<T> | T[], filter?: Predicate<T>, cancellationToken?: CancellationToken, name?: string);
        /**
         * Replaces the filter function
         * @param filter
         * @returns returns new size of array view after applying filter
         */
        updateFilter(filter: Predicate<T>): number;
        /**
         * Recalculates the filter. Only needed if your filter function isn't pure and you know the result would be different if run again compared to before
         */
        refresh(): void;
    }
    export function processTransform<I, O>(operations: DataSourceOperator<any, any>[], result: DataSource<O>): Callback<I>;
}
declare module "rendering/classname" {
    import { ReadOnlyDataSource } from "stream/data_source";
    import { CancellationToken } from "utilities/cancellation_token";
    export function aurumClassName(data: {
        [key: string]: boolean | ReadOnlyDataSource<boolean>;
    }, cancellationToken?: CancellationToken): Array<string | ReadOnlyDataSource<string>>;
}
declare module "rendering/aurum_element" {
    import { DataSource, ArrayDataSource, ReadOnlyDataSource } from "stream/data_source";
    import { DuplexDataSource } from "stream/duplex_data_source";
    import { CancellationToken } from "utilities/cancellation_token";
    export function createRenderSession(): RenderSession;
    export const aurumElementModelIdentitiy: unique symbol;
    export const nodeData: WeakMap<any, AurumNodeData>;
    export interface AurumNodeData {
    }
    export type Renderable = AurumElement | HTMLElement | Text | string | number | AurumElementModel<any> | Promise<Renderable> | DataSource<Renderable> | ArrayDataSource<Renderable> | DuplexDataSource<Renderable> | Renderable[];
    export type Rendered = AurumElement | HTMLElement | Text;
    export interface AurumComponentAPI {
        onAttach(cb: () => void): any;
        onDetach(cb: () => void): any;
        onError(cb: (error: Error) => Renderable): any;
        cancellationToken: CancellationToken;
        prerender(children: Renderable[], disposalToken?: CancellationToken): any[];
        prerender(child: Renderable, disposalToken?: CancellationToken): any;
        style(fragments: TemplateStringsArray, ...input: any[]): DataSource<string>;
        className(data: {
            [key: string]: boolean | ReadOnlyDataSource<boolean>;
        }): Array<string | ReadOnlyDataSource<string>>;
    }
    export interface AurumElementModel<T> {
        [aurumElementModelIdentitiy]: boolean;
        props: T;
        name: string;
        isIntrinsic: boolean;
        children: Renderable[];
        factory(props: T, children: Renderable[], api: AurumComponentAPI): Renderable;
    }
    export abstract class AurumElement {
        children: Rendered[];
        protected api: AurumComponentAPI;
        private static id;
        protected contentStartMarker: Comment;
        protected contentEndMarker: Comment;
        protected hostNode: HTMLElement;
        private lastStartIndex;
        private lastEndIndex;
        constructor(dataSource: ArrayDataSource<any> | DataSource<any> | DuplexDataSource<any>, api: AurumComponentAPI);
        dispose(): void;
        attachToDom(node: HTMLElement, index: number): void;
        protected getWorkIndex(): number;
        protected getLastIndex(): number;
        protected abstract render(dataSource: DataSource<any> | ArrayDataSource<any> | DuplexDataSource<any>): void;
        protected clearContent(): void;
        protected updateDom(): void;
    }
    /**
     * @internal
     */
    export interface RenderSession {
        attachCalls: Array<() => void>;
        tokens: CancellationToken[];
        sessionToken: CancellationToken;
    }
    /**
     * @internal
     */
    export function render<T extends Renderable>(element: T, session: RenderSession, prerendering?: boolean): T extends Array<any> ? any[] : any;
    export const pendingSessions: WeakMap<any, RenderSession>;
    /**
     * @internal
     */
    export function createAPI(session: RenderSession): AurumComponentAPI;
    export class ArrayAurumElement extends AurumElement {
        private renderSessions;
        private dataSource;
        constructor(dataSource: ArrayDataSource<any>, api: AurumComponentAPI);
        attachToDom(node: HTMLElement, index: number): void;
        protected render(dataSource: ArrayDataSource<any>): void;
        private spliceChildren;
        private handleNewContent;
        private renderItem;
    }
    export class SingularAurumElement extends AurumElement {
        private renderSession;
        private lastValue;
        private dataSource;
        constructor(dataSource: DataSource<any> | DuplexDataSource<any>, api: AurumComponentAPI);
        attachToDom(node: HTMLElement, index: number): void;
        protected render(dataSource: DataSource<any> | DuplexDataSource<any>): void;
        private handleNewContent;
        private fullRebuild;
        private endSession;
    }
}
declare module "stream/data_source_operators" {
    import { ThenArg, Callback } from "utilities/common";
    import { DataSource } from "stream/data_source";
    import { DuplexDataSource } from "stream/duplex_data_source";
    import { Stream } from "stream/stream";
    import { DataSourceMapOperator, DataSourceFilterOperator, DataSourceMapDelayOperator, DataSourceMapDelayFilterOperator, DataSourceDelayOperator, DataSourceDelayFilterOperator, DataSourceNoopOperator } from "stream/operator_model";
    export function dsMap<T, M>(mapper: (value: T) => M): DataSourceMapOperator<T, M>;
    export function dsMapAsync<T, M>(mapper: (value: T) => Promise<M>): DataSourceMapDelayOperator<T, M>;
    export function dsDiff<T>(): DataSourceMapOperator<T, {
        newValue: T;
        oldValue: T;
    }>;
    export function dsFilter<T>(predicate: (value: T) => boolean): DataSourceFilterOperator<T>;
    export function dsFilterAsync<T>(predicate: (value: T) => Promise<boolean>): DataSourceDelayFilterOperator<T>;
    export function dsEven(): DataSourceFilterOperator<number>;
    export function dsOdd(): DataSourceFilterOperator<number>;
    export function dsMin(): DataSourceFilterOperator<number>;
    export function dsMax(): DataSourceFilterOperator<number>;
    export function dsSkipDynamic<T>(amountLeft: DataSource<number>): DataSourceFilterOperator<T>;
    export function dsSkip<T>(amount: number): DataSourceFilterOperator<T>;
    export function dsCutOff<T>(amount: number): DataSourceFilterOperator<T>;
    export function dsCutOffDynamic<T>(amountLeft: DataSource<number>): DataSourceFilterOperator<T>;
    export function dsUnique<T>(): DataSourceFilterOperator<T>;
    export function dsAwait<T>(): DataSourceMapDelayOperator<T, ThenArg<T>>;
    export function dsAwaitOrdered<T>(): DataSourceMapDelayOperator<T, ThenArg<T>>;
    export function dsAwaitLatest<T>(): DataSourceMapDelayFilterOperator<T, ThenArg<T>>;
    export function dsReduce<T, M = T>(reducer: (p: M, c: T) => M, initialValue: M): DataSourceMapOperator<T, M>;
    export function dsStringJoin(seperator?: string): DataSourceMapOperator<string, string>;
    export function dsDelay<T>(time: number): DataSourceDelayOperator<T>;
    export function dsDebounce<T>(time: number): DataSourceDelayFilterOperator<T>;
    /**
     * Debounce update to occur at most one per animation frame
     */
    export function dsThrottleFrame<T>(): DataSourceDelayFilterOperator<T>;
    export function dsSemaphore<T>(state: DataSource<number>): DataSourceDelayOperator<T>;
    export function dsLock<T>(state: DataSource<boolean>): DataSourceDelayOperator<T>;
    export function dsThrottle<T>(time: number): DataSourceFilterOperator<T>;
    export function dsBuffer<T>(time: number): DataSourceMapDelayFilterOperator<T, T[]>;
    export function dsPick<T, K extends keyof T>(key: K): DataSourceMapOperator<T, T[K]>;
    export function dsPipe<T>(target: DataSource<T> | DuplexDataSource<T> | Stream<T, any>): DataSourceNoopOperator<T>;
    /**
     * Same as pipe except for duplex data sources it pipes upstream
     */
    export function dsPipeUp<T>(target: DataSource<T> | DuplexDataSource<T> | Stream<T, any>): DataSourceNoopOperator<T>;
    export function dsTap<T>(cb: Callback<T>): DataSourceNoopOperator<T>;
    export function dsLoadBalance<T>(targets: Array<DataSource<T> | DuplexDataSource<T> | Stream<T, any>>): DataSourceNoopOperator<T>;
}
declare module "nodes/dom_adapter" {
    import { ClassType, DataDrain, Callback, MapLike, AttributeValue } from "utilities/common";
    import { Renderable, AurumComponentAPI } from "rendering/aurum_element";
    import { CancellationToken } from "utilities/cancellation_token";
    export interface HTMLNodeProps<T> {
        id?: AttributeValue;
        name?: AttributeValue;
        draggable?: AttributeValue;
        class?: ClassType;
        tabindex?: AttributeValue;
        style?: AttributeValue;
        title?: AttributeValue;
        role?: AttributeValue;
        slot?: AttributeValue;
        contentEditable?: AttributeValue;
        onDblClick?: DataDrain<MouseEvent>;
        onClick?: DataDrain<MouseEvent>;
        onKeyDown?: DataDrain<KeyboardEvent>;
        onKeyUp?: DataDrain<KeyboardEvent>;
        onMouseDown?: DataDrain<MouseEvent>;
        onMouseUp?: DataDrain<MouseEvent>;
        onMouseEnter?: DataDrain<MouseEvent>;
        onMouseLeave?: DataDrain<MouseEvent>;
        onMouseMove?: DataDrain<MouseEvent>;
        onMouseWheel?: DataDrain<WheelEvent>;
        onBlur?: DataDrain<FocusEvent>;
        onFocus?: DataDrain<FocusEvent>;
        onDrag?: DataDrain<DragEvent>;
        onDragEnd?: DataDrain<DragEvent>;
        onDragEnter?: DataDrain<DragEvent>;
        onDragExit?: DataDrain<DragEvent>;
        onDragLeave?: DataDrain<DragEvent>;
        onDragOver?: DataDrain<DragEvent>;
        onDragStart?: DataDrain<DragEvent>;
        onLoad?: DataDrain<Event>;
        onError?: DataDrain<ErrorEvent>;
        onAttach?: Callback<T>;
        onDetach?: Callback<T>;
    }
    /**
     * @internal
     */
    export const defaultEvents: MapLike<string>;
    /**
     * @internal
     */
    export const defaultAttributes: string[];
    export function DomNodeCreator<T extends HTMLNodeProps<any>>(nodeName: string, extraAttributes?: string[], extraEvents?: MapLike<string>, extraLogic?: (node: HTMLElement, props: T, cleanUp: CancellationToken) => void): (props: T, children: Renderable[], api: AurumComponentAPI) => HTMLElement;
    export function processHTMLNode(node: HTMLElement, props: HTMLNodeProps<any>, cleanUp: CancellationToken, extraAttributes?: string[], extraEvents?: MapLike<string>): void;
    export function createEventHandlers(node: HTMLElement, events: MapLike<string>, props: any): void;
}
declare module "nodes/input" {
    import { HTMLNodeProps } from "nodes/dom_adapter";
    import { AttributeValue, DataDrain } from "utilities/common";
    import { GenericDataSource } from "stream/data_source";
    export interface InputProps extends HTMLNodeProps<HTMLInputElement> {
        placeholder?: AttributeValue;
        readonly?: AttributeValue;
        disabled?: AttributeValue;
        onChange?: DataDrain<InputEvent>;
        onInput?: DataDrain<InputEvent>;
        value?: GenericDataSource<string> | string;
        accept?: AttributeValue;
        alt?: AttributeValue;
        autocomplete?: AttributeValue;
        autofocus?: AttributeValue;
        checked?: GenericDataSource<boolean> | boolean;
        defaultChecked?: AttributeValue;
        formAction?: AttributeValue;
        formEnctype?: AttributeValue;
        formMethod?: AttributeValue;
        formNoValidate?: AttributeValue;
        formTarget?: AttributeValue;
        max?: AttributeValue;
        maxLength?: AttributeValue;
        min?: AttributeValue;
        minLength?: AttributeValue;
        pattern?: AttributeValue;
        multiple?: AttributeValue;
        required?: AttributeValue;
        type?: AttributeValue;
    }
    /**
     * @internal
     */
    export const Input: (props: InputProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
}
declare module "nodes/select" {
    import { GenericDataSource } from "stream/data_source";
    import { HTMLNodeProps } from "nodes/dom_adapter";
    export interface SelectProps extends HTMLNodeProps<HTMLSelectElement> {
        value?: GenericDataSource<string> | string;
        selectedIndex?: GenericDataSource<number> | number;
    }
    /**
     * @internal
     */
    export const Select: (props: SelectProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
}
declare module "nodes/simple_dom_nodes" {
    import { HTMLNodeProps } from "nodes/dom_adapter";
    import { AttributeValue } from "utilities/common";
    export interface AProps extends HTMLNodeProps<HTMLAnchorElement> {
        href?: AttributeValue;
        target?: AttributeValue;
    }
    export interface AreaProps extends HTMLNodeProps<HTMLAreaElement> {
        alt?: AttributeValue;
        coords?: AttributeValue;
        download?: AttributeValue;
        href?: AttributeValue;
        hreflang?: AttributeValue;
        media?: AttributeValue;
        rel?: AttributeValue;
        shape?: AttributeValue;
        target?: AttributeValue;
        type?: AttributeValue;
    }
    export interface VideoProps extends HTMLNodeProps<HTMLVideoElement> {
        controls?: AttributeValue;
        autoplay?: AttributeValue;
        loop?: AttributeValue;
        muted?: AttributeValue;
        preload?: AttributeValue;
        src?: AttributeValue;
        poster?: AttributeValue;
        width?: AttributeValue;
        height?: AttributeValue;
    }
    export interface AudioProps extends HTMLNodeProps<HTMLAudioElement> {
        controls?: AttributeValue;
        autoplay?: AttributeValue;
        loop?: AttributeValue;
        muted?: AttributeValue;
        preload?: AttributeValue;
        src?: AttributeValue;
    }
    export interface FormProps extends HTMLNodeProps<HTMLFormElement> {
        action?: AttributeValue;
        method?: AttributeValue;
        rel?: AttributeValue;
        enctype?: AttributeValue;
        novalidate?: AttributeValue;
        target?: AttributeValue;
    }
    export interface ButtonProps extends HTMLNodeProps<HTMLButtonElement> {
        type?: AttributeValue;
        disabled?: AttributeValue;
    }
    export interface CanvasProps extends HTMLNodeProps<HTMLCanvasElement> {
        width?: AttributeValue;
        height?: AttributeValue;
    }
    export interface DataProps extends HTMLNodeProps<HTMLDataElement> {
        value?: AttributeValue;
    }
    export interface IFrameProps extends HTMLNodeProps<HTMLIFrameElement> {
        src?: AttributeValue;
        allow?: AttributeValue;
        allowFullscreen?: AttributeValue;
        allowPaymentRequest?: AttributeValue;
        width?: AttributeValue;
        height?: AttributeValue;
        srcdoc?: AttributeValue;
    }
    export interface ImgProps extends HTMLNodeProps<HTMLImageElement> {
        src?: AttributeValue;
        alt?: AttributeValue;
        width?: AttributeValue;
        height?: AttributeValue;
        referrerPolicy?: AttributeValue;
        sizes?: AttributeValue;
        srcset?: AttributeValue;
        useMap?: AttributeValue;
    }
    export interface LabelProps extends HTMLNodeProps<HTMLLabelElement> {
        for?: AttributeValue;
    }
    export interface LinkProps extends HTMLNodeProps<HTMLLinkElement> {
        href?: AttributeValue;
        rel?: AttributeValue;
        media?: AttributeValue;
        as?: AttributeValue;
        disabled?: AttributeValue;
        type?: AttributeValue;
    }
    export interface TimeProps extends HTMLNodeProps<HTMLTimeElement> {
        datetime?: AttributeValue;
    }
    export interface StyleProps extends HTMLNodeProps<HTMLStyleElement> {
        media?: AttributeValue;
    }
    export interface SourceProps extends HTMLNodeProps<HTMLSourceElement> {
        src?: AttributeValue;
        srcSet?: AttributeValue;
        media?: AttributeValue;
        sizes?: AttributeValue;
        type?: AttributeValue;
    }
    export interface ScriptProps extends HTMLNodeProps<HTMLScriptElement> {
        src?: AttributeValue;
        async?: AttributeValue;
        defer?: AttributeValue;
        integrity?: AttributeValue;
        noModule?: AttributeValue;
        type?: AttributeValue;
    }
    export interface SvgProps extends HTMLNodeProps<HTMLOrSVGElement> {
        width?: AttributeValue;
        height?: AttributeValue;
    }
    export interface ProgressProps extends HTMLNodeProps<HTMLProgressElement> {
        max?: AttributeValue;
        value?: AttributeValue;
    }
    export interface OptionProps extends HTMLNodeProps<HTMLElement> {
        value?: AttributeValue;
    }
    export interface SlotProps extends HTMLNodeProps<HTMLSlotElement> {
    }
    /**
     * @internal
     */
    export const Code: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Div: (props: HTMLNodeProps<HTMLDivElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const A: (props: AProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Abbr: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Address: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const H1: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const H2: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const H3: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const H4: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const H5: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const H6: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Area: (props: HTMLNodeProps<HTMLAreaElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Article: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Aside: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Span: (props: HTMLNodeProps<HTMLSpanElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const NoScript: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Video: (props: VideoProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Ul: (props: HTMLNodeProps<HTMLUListElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Ol: (props: HTMLNodeProps<HTMLOListElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Li: (props: HTMLNodeProps<HTMLLIElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Tr: (props: HTMLNodeProps<HTMLTableRowElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const B: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Body: (props: HTMLNodeProps<HTMLBodyElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Title: (props: HTMLNodeProps<HTMLTitleElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Summary: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const THead: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Template: (props: HTMLNodeProps<HTMLTemplateElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Q: (props: HTMLNodeProps<HTMLQuoteElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Pre: (props: HTMLNodeProps<HTMLPreElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const P: (props: HTMLNodeProps<HTMLParagraphElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Hr: (props: HTMLNodeProps<HTMLHRElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Audio: (props: AudioProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Br: (props: HTMLNodeProps<HTMLBRElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Button: (props: ButtonProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Canvas: (props: CanvasProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Data: (props: DataProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Details: (props: HTMLNodeProps<HTMLDetailsElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Em: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Footer: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Form: (props: FormProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Head: (props: HTMLNodeProps<HTMLHeadElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Header: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Heading: (props: HTMLNodeProps<HTMLHeadingElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const I: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const IFrame: (props: IFrameProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Img: (props: ImgProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Label: (props: LabelProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Link: (props: LinkProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Nav: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Sub: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Sup: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Table: (props: HTMLNodeProps<HTMLTableElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const TBody: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const TFoot: (props: HTMLNodeProps<HTMLElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Td: (props: HTMLNodeProps<HTMLTableColElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Th: (props: HTMLNodeProps<HTMLTableHeaderCellElement>, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Time: (props: TimeProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Style: (props: StyleProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Source: (props: SourceProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Script: (props: ScriptProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Svg: (props: SvgProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Progress: (props: ProgressProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Option: (props: OptionProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
    /**
     * @internal
     */
    export const Slot: (props: SlotProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
}
declare module "nodes/textarea" {
    import { GenericDataSource } from "stream/data_source";
    import { AttributeValue, DataDrain } from "utilities/common";
    import { HTMLNodeProps } from "nodes/dom_adapter";
    export interface TextAreaProps extends HTMLNodeProps<HTMLTextAreaElement> {
        placeholder?: AttributeValue;
        readonly?: AttributeValue;
        disabled?: AttributeValue;
        onChange?: DataDrain<InputEvent>;
        onInput?: DataDrain<InputEvent>;
        value?: GenericDataSource<string> | string;
        rows?: AttributeValue;
        wrap?: AttributeValue;
        autocomplete?: AttributeValue;
        autofocus?: AttributeValue;
        max?: AttributeValue;
        maxLength?: AttributeValue;
        min?: AttributeValue;
        minLength?: AttributeValue;
        required?: AttributeValue;
        type?: AttributeValue;
    }
    /**
     * @internal
     */
    export const TextArea: (props: TextAreaProps, children: import("aurumjs").Renderable[], api: import("aurumjs").AurumComponentAPI) => HTMLElement;
}
declare module "utilities/aurum" {
    import { HTMLNodeProps } from "nodes/dom_adapter";
    import { InputProps } from "nodes/input";
    import { SelectProps } from "nodes/select";
    import { AProps, AreaProps, AudioProps, ButtonProps, CanvasProps, DataProps, IFrameProps, ImgProps, LabelProps, LinkProps, OptionProps, ProgressProps, ScriptProps, SourceProps, StyleProps, SvgProps, TimeProps, VideoProps, SlotProps, FormProps } from "nodes/simple_dom_nodes";
    import { TextAreaProps } from "nodes/textarea";
    import { AurumComponentAPI, AurumElementModel, Renderable } from "rendering/aurum_element";
    import { MapLike } from "utilities/common";
    import { CancellationToken } from "utilities/cancellation_token";
    export class Aurum {
        static attach(aurumRenderable: Renderable, dom: HTMLElement): CancellationToken;
        static factory(node: string | ((props: any, children: Renderable[], api: AurumComponentAPI) => Renderable), args: MapLike<any>, ...innerNodes: AurumElementModel<any>[]): AurumElementModel<any>;
    }
    export namespace Aurum {
        namespace JSX {
            interface IntrinsicElements {
                code: HTMLNodeProps<HTMLElement>;
                button: ButtonProps;
                hr: HTMLNodeProps<HTMLHRElement>;
                div: HTMLNodeProps<HTMLDivElement>;
                input: InputProps;
                li: HTMLNodeProps<HTMLLIElement>;
                span: HTMLNodeProps<HTMLElement>;
                style: StyleProps;
                ul: HTMLNodeProps<HTMLUListElement>;
                p: HTMLNodeProps<HTMLParagraphElement>;
                img: ImgProps;
                link: LinkProps;
                canvas: CanvasProps;
                a: AProps;
                article: HTMLNodeProps<HTMLElement>;
                br: HTMLNodeProps<HTMLBRElement>;
                form: FormProps;
                label: LabelProps;
                ol: HTMLNodeProps<HTMLOListElement>;
                pre: HTMLNodeProps<HTMLPreElement>;
                progress: ProgressProps;
                table: HTMLNodeProps<HTMLTableElement>;
                td: HTMLNodeProps<HTMLTableColElement>;
                tr: HTMLNodeProps<HTMLTableRowElement>;
                th: HTMLNodeProps<HTMLTableHeaderCellElement>;
                textarea: TextAreaProps;
                h1: HTMLNodeProps<HTMLElement>;
                h2: HTMLNodeProps<HTMLElement>;
                h3: HTMLNodeProps<HTMLElement>;
                h4: HTMLNodeProps<HTMLElement>;
                h5: HTMLNodeProps<HTMLElement>;
                h6: HTMLNodeProps<HTMLElement>;
                header: HTMLNodeProps<HTMLElement>;
                footer: HTMLNodeProps<HTMLElement>;
                nav: HTMLNodeProps<HTMLElement>;
                b: HTMLNodeProps<HTMLElement>;
                i: HTMLNodeProps<HTMLElement>;
                script: ScriptProps;
                abbr: HTMLNodeProps<HTMLElement>;
                area: AreaProps;
                slot: SlotProps;
                aside: HTMLNodeProps<HTMLElement>;
                audio: AudioProps;
                em: HTMLNodeProps<HTMLElement>;
                heading: HTMLNodeProps<HTMLHeadingElement>;
                iframe: IFrameProps;
                noscript: HTMLNodeProps<HTMLElement>;
                option: OptionProps;
                q: HTMLNodeProps<HTMLQuoteElement>;
                select: SelectProps;
                source: SourceProps;
                title: HTMLNodeProps<HTMLTitleElement>;
                video: VideoProps;
                tbody: HTMLNodeProps<HTMLElement>;
                tfoot: HTMLNodeProps<HTMLElement>;
                thead: HTMLNodeProps<HTMLElement>;
                summary: HTMLNodeProps<HTMLElement>;
                details: HTMLNodeProps<HTMLDetailsElement>;
                sub: HTMLNodeProps<HTMLElement>;
                sup: HTMLNodeProps<HTMLElement>;
                svg: SvgProps;
                data: DataProps;
                time: TimeProps;
                body: HTMLNodeProps<HTMLBodyElement>;
                head: HTMLNodeProps<HTMLHeadElement>;
                template: HTMLNodeProps<HTMLTemplateElement>;
            }
        }
    }
}
declare module "rendering/webcomponent" {
    import { AurumComponentAPI, Renderable } from "rendering/aurum_element";
    export function Webcomponent<T>(config: {
        /**
         * Name of the webcomponent, must be  lower case kebab case as required by the spec
         */
        name: string;
        /**
         * List of attributes of the web component that will be transformed into a data source that reflects the exact state of the attribute in the DOM no matter what changes the attirbute
         */
        observedAttributes?: string[];
        shadowRootMode?: 'open' | 'closed';
        shadowRootDelegatesFocus?: boolean;
    }, logic: (props: T, api: AurumComponentAPI) => Renderable): (props: T, children: Renderable[], api: AurumComponentAPI) => Renderable;
}
declare module "builtin_compoents/router" {
    import { DataSource } from "stream/data_source";
    import { Renderable, AurumComponentAPI } from "rendering/aurum_element";
    export function AurumRouter(props: {}, children: Renderable[], api: AurumComponentAPI): DataSource<Renderable[]>;
    export interface RouteProps {
        href: string;
    }
    export function Route(props: RouteProps, children: any): undefined;
    export function DefaultRoute(props: {}, children: any): undefined;
}
declare module "builtin_compoents/suspense" {
    import { Renderable, AurumComponentAPI } from "rendering/aurum_element";
    import { DataSource } from "stream/data_source";
    export interface SuspenseProps {
        fallback?: Renderable;
    }
    export function Suspense(props: SuspenseProps, children: Renderable[], api: AurumComponentAPI): DataSource<Renderable>;
}
declare module "builtin_compoents/switch" {
    import { AurumComponentAPI, Renderable } from "rendering/aurum_element";
    import { GenericDataSource } from "stream/data_source";
    export interface SwitchProps<T = boolean> {
        state: GenericDataSource<T>;
    }
    export function Switch<T = boolean>(props: SwitchProps<T>, children: Renderable[], api: AurumComponentAPI): import("stream/data_source").DataSource<Renderable[]>;
    export interface SwitchCaseProps<T> {
        when: T;
    }
    export function SwitchCase<T>(props: SwitchCaseProps<T>, children: any): undefined;
    export function DefaultSwitchCase(props: {}, children: any): undefined;
}
declare module "stream/object_data_source" {
    import { ArrayDataSource, DataSource } from "stream/data_source";
    import { Callback } from "utilities/common";
    import { CancellationToken } from "utilities/cancellation_token";
    export interface ObjectChange<T, K extends keyof T> {
        key: K;
        oldValue: T[K];
        newValue: T[K];
        deleted?: boolean;
    }
    export class ObjectDataSource<T> {
        protected data: T;
        private updateEvent;
        private updateEventOnKey;
        constructor(initialData: T);
        /**
         * Creates a datasource for a single key of the object
         * @param key
         * @param cancellationToken
         */
        pick<K extends keyof T>(key: K, cancellationToken?: CancellationToken): DataSource<T[K]>;
        /**
         * Listen to changes of the object
         */
        listen(callback: Callback<ObjectChange<T, keyof T>>, cancellationToken?: CancellationToken): Callback<void>;
        map<D>(mapper: (change: ObjectChange<T, keyof T>) => D): ArrayDataSource<D>;
        /**
         * Same as listen but will immediately call the callback with the current value of each key
         */
        listenAndRepeat(callback: Callback<ObjectChange<T, keyof T>>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Same as listenOnKey but will immediately call the callback with the current value first
         */
        listenOnKeyAndRepeat<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, keyof T>>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Listen to changes of a single key of the object
         */
        listenOnKey<K extends keyof T>(key: K, callback: Callback<ObjectChange<T, K>>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Returns all the keys of the object in the source
         */
        keys(): string[];
        /**
         * Returns all the values of the object in the source
         */
        values(): any;
        /**
         * get the current value of a key of the object
         * @param key
         */
        get<K extends keyof T>(key: K): T[K];
        /**
         * delete a key from the object
         * @param key
         * @param value
         */
        delete<K extends keyof T>(key: K): void;
        /**
         * set the value for a key of the object
         * @param key
         * @param value
         */
        set<K extends keyof T>(key: K, value: T[K]): void;
        /**
         * Merge the key value pairs of an object into this object non recursively
         * @param newData
         */
        assign(newData: Partial<T> | ObjectDataSource<T>): void;
        /**
         * Returns a shallow copy of the object
         */
        toObject(): T;
        /**
         * Returns a simplified version of this datasource
         */
        toDataSource(): DataSource<T>;
    }
}
declare module "stream/map_data_source" {
    import { ArrayDataSource, DataSource } from "stream/data_source";
    import { Callback } from "utilities/common";
    import { CancellationToken } from "utilities/cancellation_token";
    export interface MapChange<K, V> {
        key: K;
        oldValue: V;
        newValue: V;
        deleted?: boolean;
    }
    export class MapDataSource<K, V> {
        protected data: Map<K, V>;
        private updateEvent;
        private updateEventOnKey;
        constructor(initialData: Map<K, V>);
        /**
         * Creates a datasource for a single key of the object
         * @param key
         * @param cancellationToken
         */
        pick(key: K, cancellationToken?: CancellationToken): DataSource<V>;
        /**
         * Listen to changes of the object
         */
        listen(callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Same as listen but will immediately call the callback with the current value of each key
         */
        listenAndRepeat(callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): Callback<void>;
        map<D>(mapper: (change: MapChange<K, V>) => D): ArrayDataSource<D>;
        /**
         * Same as listenOnKey but will immediately call the callback with the current value first
         */
        listenOnKeyAndRepeat(key: K, callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Listen to changes of a single key of the object
         */
        listenOnKey(key: K, callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Returns all the keys of the object in the source
         */
        keys(): IterableIterator<K>;
        /**
         * Returns all the values of the object in the source
         */
        values(): IterableIterator<V>;
        /**
         * get the current value of a key of the object
         * @param key
         */
        get(key: K): V;
        /**
         * check if map has a key
         * @param key
         */
        has(key: K): boolean;
        /**
         * delete a key from the object
         * @param key
         * @param value
         */
        delete(key: K): void;
        /**
         * set the value for a key of the object
         * @param key
         * @param value
         */
        set(key: K, value: V): void;
        /**
         * Merge the key value pairs of an object into this object non recursively
         * @param newData
         */
        assign(newData: Map<K, V> | MapDataSource<K, V>): void;
        /**
         * Returns a shallow copy of the map
         */
        toMap(): Map<K, V>;
    }
}
declare module "stream/set_data_source" {
    import { ArrayDataSource, DataSource } from "stream/data_source";
    import { Callback } from "utilities/common";
    import { CancellationToken } from "utilities/cancellation_token";
    export interface SetChange<K> {
        key: K;
        exists: boolean;
    }
    export class SetDataSource<K> {
        protected data: Set<K>;
        private updateEvent;
        private updateEventOnKey;
        constructor(initialData: Set<K>);
        /**
         * Creates a datasource for a single key of the object
         * @param key
         * @param cancellationToken
         */
        pick(key: K, cancellationToken?: CancellationToken): DataSource<boolean>;
        /**
         * Listen to changes of the object
         */
        listen(callback: Callback<SetChange<K>>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Same as listen but will immediately call the callback with the current value of each key
         */
        listenAndRepeat(callback: Callback<SetChange<K>>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Same as listenOnKey but will immediately call the callback with the current value first
         */
        listenOnKeyAndRepeat(key: K, callback: Callback<boolean>, cancellationToken?: CancellationToken): Callback<void>;
        /**
         * Listen to changes of a single key of the object
         */
        listenOnKey(key: K, callback: Callback<boolean>, cancellationToken?: CancellationToken): Callback<void>;
        map<D>(mapper: (change: SetChange<K>) => D): ArrayDataSource<D>;
        /**
         * Returns all the keys of the object in the source
         */
        keys(): IterableIterator<K>;
        /**
         * check if map has a key
         * @param key
         */
        has(key: K): boolean;
        /**
         * delete a key from the object
         * @param key
         * @param value
         */
        delete(key: K): void;
        /**
         * set the value for a key of the object
         * @param key
         * @param value
         */
        add(key: K): void;
        /**
         * Merge the key value pairs of an object into this object non recursively
         * @param newData
         */
        assign(newData: Set<K> | SetDataSource<K>): void;
        /**
         * Returns a shallow copy of the set
         */
        toSet(): Set<K>;
    }
}
declare module "aurumjs" {
    export * from "rendering/classname";
    export * from "rendering/webcomponent";
    export * from "rendering/aurum_element";
    export * from "builtin_compoents/router";
    export * from "builtin_compoents/suspense";
    export * from "builtin_compoents/switch";
    export * from "stream/data_source";
    export * from "stream/duplex_data_source";
    export * from "stream/object_data_source";
    export * from "stream/map_data_source";
    export * from "stream/set_data_source";
    export * from "stream/data_source_operators";
    export * from "stream/operator_model";
    export * from "stream/stream";
    export * from "utilities/aurum";
    export * from "utilities/cancellation_token";
    export * from "utilities/event_emitter";
    export { debugMode, enableDebugMode } from "debug_mode";
    export { AttributeValue, ClassType, DataDrain } from "utilities/common";
}
//# sourceMappingURL=aurumjs.d.ts.map