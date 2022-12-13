import { getValueOf } from '../aurumjs.js';
import { AurumServerInfo, syncArrayDataSource, syncDataSource, syncMapDataSource, syncSetDataSource } from '../aurum_server/aurum_server_client.js';
import { debugDeclareUpdate, debugMode, debugRegisterConsumer, debugRegisterLink, debugRegisterStream } from '../debug_mode.js';
import { CancellationToken } from '../utilities/cancellation_token.js';
import { Callback, Predicate } from '../utilities/common.js';
import { EventEmitter } from '../utilities/event_emitter.js';
import { dsDiff, dsTap } from './data_source_operators.js';
import { DuplexDataSource } from './duplex_data_source.js';
import {
    DataSourceDelayFilterOperator,
    DataSourceFilterOperator,
    DataSourceMapDelayFilterOperator,
    DataSourceMapOperator,
    DataSourceOperator,
    OperationType
} from './operator_model.js';
import { Stream } from './stream.js';

export interface ReadOnlyDataSource<T> {
    readonly value: T;
    readonly name: string;
    listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    listen(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    listenOnce(callback: Callback<T>, cancellationToken?: CancellationToken): Callback<void>;
    awaitNextUpdate(cancellationToken?: CancellationToken): Promise<T>;
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
    ): ReadOnlyDataSource<K>;
}

export interface GenericDataSource<T> extends ReadOnlyDataSource<T> {
    readonly value: T;
    readonly name: string;
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
export class DataSource<T> implements GenericDataSource<T>, ReadOnlyDataSource<T> {
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

    public toString(): string {
        return this.value.toString();
    }

    public static toDataSource<T>(value: T | DataSource<T>): DataSource<T> {
        if (value instanceof DataSource) {
            return value;
        } else {
            return new DataSource(value);
        }
    }

    public static fromEvent<T>(event: EventEmitter<T>, cancellation: CancellationToken): DataSource<T> {
        const result = new DataSource<T>();
        event.subscribe((v) => result.update(v), cancellation);
        return result;
    }

    /**
     * Connects to an aurum-server exposed datasource. View https://github.com/CyberPhoenix90/aurum-server for more information
     * Note that type safety is not guaranteed. Whatever the server sends as an update will be propagated
     * @param  {AurumServerInfo} aurumServerInfo
     * @returns DataSource
     */
    public static fromRemoteSource<T>(aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): DataSource<T> {
        const result = new DataSource<T>();

        syncDataSource(result, aurumServerInfo, cancellation);

        return result;
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
        //@ts-expect-error Typescript tries to be smart and thinks this could never happen but it can with the any type as T
        if(newValue === this) {
            throw new Error('Cannot update data source with itself');
        }

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
        if (this.primed) {
            callback(this.value);
        }
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

    public static fromAggregation<R, A>(sources: [ReadOnlyDataSource<A>], combinator?: (first: A) => R, cancellationToken?: CancellationToken): DataSource<R>;
    public static fromAggregation<R, A, B>(
        sources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>],
        combinator?: (first: A, second: B) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R, A, B, C>(
        sources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>],
        combinator?: (first: A, second: B, third: C) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R, A, B, C, D>(
        sources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>],
        combinator?: (first: A, second: B, third: C, fourth: D) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R, A, B, C, D, E>(
        sources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>, ReadOnlyDataSource<E>],
        combinator?: (first: A, second: B, third: C, fourth: D, fifth: E) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R, A, B, C, D, E, F>(
        sources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>, ReadOnlyDataSource<E>, ReadOnlyDataSource<F>],
        combinator?: (first: A, second: B, third: C, fourth: D, fifth: E, sixth: F) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R, A, B, C, D, E, F, G>(
        sources: [
            ReadOnlyDataSource<A>,
            ReadOnlyDataSource<B>,
            ReadOnlyDataSource<C>,
            ReadOnlyDataSource<D>,
            ReadOnlyDataSource<E>,
            ReadOnlyDataSource<F>,
            ReadOnlyDataSource<G>
        ],
        combinator?: (first: A, second: B, third: C, fourth: D, fifth: E, sixth: F, seventh: G) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R, A, B, C, D, E, F, G, H>(
        sources: [
            ReadOnlyDataSource<A>,
            ReadOnlyDataSource<B>,
            ReadOnlyDataSource<C>,
            ReadOnlyDataSource<D>,
            ReadOnlyDataSource<E>,
            ReadOnlyDataSource<F>,
            ReadOnlyDataSource<G>,
            ReadOnlyDataSource<H>
        ],
        combinator?: (first: A, second: B, third: C, fourth: D, fifth: E, sixth: F, seventh: G, eigth: H) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R, A, B, C, D, E, F, G, H, I>(
        sources: [
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
        combinator?: (first: A, second: B, third: C, fourth: D, fifth: E, sixth: F, seventh: G, eigth: H, ninth: I) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R>(
        sources: ReadOnlyDataSource<any>[],
        combinator?: (...data: any[]) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R> {
        cancellationToken = cancellationToken ?? new CancellationToken();

        const aggregatedSource = new DataSource<R>(combinator(...sources.map((s) => s?.value)));

        for (let i = 0; i < sources.length; i++) {
            sources[i]?.listen(() => {
                aggregatedSource.update(combinator(...sources.map((s) => s?.value)));
            }, cancellationToken);
        }

        return aggregatedSource;
    }

    /**
     * Combines two or more sources into a new source that listens to updates from both parent sources and combines them
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
            ReadOnlyDataSource<H>,
            ReadOnlyDataSource<I>
        ],
        combinator?: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H, tenth: I) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public aggregate<R>(otherSources: ReadOnlyDataSource<any>[], combinator?: (...data: any[]) => R, cancellationToken?: CancellationToken): DataSource<R> {
        cancellationToken = cancellationToken ?? new CancellationToken();

        const aggregatedSource = new DataSource<R>(combinator(this.value, ...otherSources.map((s) => s?.value)));

        for (let i = 0; i < otherSources.length; i++) {
            otherSources[i]?.listen(() => {
                aggregatedSource.update(combinator(this.value, ...otherSources.map((s) => s?.value)));
            }, cancellationToken);
        }

        this.listen(() => aggregatedSource.update(combinator(this.value, ...otherSources.map((s) => s?.value))), cancellationToken);

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
     * Like aggregate except that it aggregates an array data source of datasources
     * @param data Second parent for the new source
     * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
     */
    public static dynamicAggregation<I, O>(
        data: ReadOnlyArrayDataSource<ReadOnlyDataSource<I>>,
        aggregate: (items: readonly I[]) => O,
        cancellationToken?: CancellationToken
    ): DataSource<O> {
        cancellationToken = cancellationToken ?? new CancellationToken();
        const session = new WeakMap<ReadOnlyDataSource<I>, CancellationToken>();

        const result = new DataSource<O>();
        data.listenAndRepeat((change) => {
            for (const item of change.items) {
                listenToSubSource(item);
            }
            result.update(aggregate(data.getData().map((e) => e.value)));
        });

        data.onItemsAdded.subscribe((items) => {
            for (const item of items) {
                listenToSubSource(item);
            }
        });

        data.onItemsRemoved.subscribe((items) => {
            for (const item of items) {
                session.get(item).cancel();
                session.delete(item);
            }
        });

        return result;

        function listenToSubSource(item: ReadOnlyDataSource<I>) {
            session.set(item, new CancellationToken());
            item.listen(() => {
                result.update(aggregate(data.getData().map((e) => e.value)));
            }, session.get(item));
        }
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

type DetailedOperations = 'replace' | 'append' | 'prepend' | 'removeRight' | 'removeLeft' | 'remove' | 'swap' | 'clear' | 'merge' | 'insert';

export interface CollectionChange<T> {
    operation: 'replace' | 'swap' | 'add' | 'remove' | 'merge';
    operationDetailed: DetailedOperations;
    count?: number;
    index: number;
    index2?: number;
    target?: T;
    items: T[];
    newState: T[];
    previousState?: T[];
}

export interface ReadOnlyArrayDataSource<T> {
    [Symbol.iterator](): IterableIterator<T>;
    onItemsAdded: EventEmitter<T[]>;
    onItemsRemoved: EventEmitter<T[]>;
    listenAndRepeat(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void>;
    listen(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void>;
    listenOnce(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): Callback<void>;
    awaitNextUpdate(cancellationToken?: CancellationToken): Promise<CollectionChange<T>>;
    length: ReadOnlyDataSource<number>;
    getData(): ReadonlyArray<T>;
    get(index: number): T;
    indexOf(item: T): number;
    find(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg?: any): T;
    findIndex(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg?: any): number;
    lastIndexOf(item: T): number;
    includes(item: T): boolean;
    some(cb: (item: T, index: number, array: T[]) => boolean): boolean;
    every(cb: (item: T, index: number, array: T[]) => boolean): boolean;
    toArray(): T[];
    forEach(callbackfn: (value: T, index: number, array: T[]) => void): void;
    reverse(cancellationToken?: CancellationToken, config?: ViewConfig): ReadOnlyArrayDataSource<T>;
    flat(
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): T extends ReadOnlyArrayDataSource<infer U> ? ReadOnlyArrayDataSource<U> : ReadOnlyArrayDataSource<FlatArray<T, 1>>;
    sort(
        comparator?: (a: T, b: T) => number,
        dependencies?: ReadOnlyDataSource<any>[],
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): ReadOnlyArrayDataSource<T>;
    map<D>(
        mapper: (data: T) => D,
        dependencies?: ReadOnlyDataSource<any>[],
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): ReadOnlyArrayDataSource<D>;
    slice(
        start: number | DataSource<number>,
        end?: number | DataSource<number>,
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): ReadOnlyArrayDataSource<T>;
    reduce<R>(reducer: (acc: R, value: T) => R, initial?: R, cancellationToken?: CancellationToken): DataSource<R>;
    unique(cancellationToken?: CancellationToken, config?: ViewConfig): ReadOnlyArrayDataSource<T>;
    indexBy<K extends keyof T>(key: K, cancellationToken?: CancellationToken, config?: ViewConfig): MapDataSource<T[K], T>;
    indexByProvider<K>(provider: (item: T) => K, cancellationToken?: CancellationToken, config?: ViewConfig): MapDataSource<K, T>;
    groupBy<K extends keyof T>(key: K, cancellationToken?: CancellationToken, config?: ViewConfig): MapDataSource<T[K], ReadOnlyArrayDataSource<T>>;
    groupByProvider<K>(provider: (item: T) => K, cancellationToken?: CancellationToken, config?: ViewConfig): MapDataSource<K, ReadOnlyArrayDataSource<T>>;
    groupByMultiProvider<K>(
        provider: (item: T) => K[],
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): MapDataSource<K, ReadOnlyArrayDataSource<T>>;
    filter(
        callback: Predicate<T>,
        dependencies?: ReadOnlyDataSource<any>[],
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): ReadOnlyArrayDataSource<T>;
    toSetDataSource(cancellationToken: CancellationToken): ReadOnlySetDataSource<T>;
    pipe(target: ArrayDataSource<T>, cancellation?: CancellationToken): void;
}

export class ArrayDataSource<T> implements ReadOnlyArrayDataSource<T> {
    protected data: T[];
    protected updateEvent: EventEmitter<CollectionChange<T>>;
    private lengthSource: DataSource<number>;
    private name: string;
    public onItemsAdded: EventEmitter<T[]> = new EventEmitter();
    public onItemsRemoved: EventEmitter<T[]> = new EventEmitter();

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

    *[Symbol.iterator](): IterableIterator<T> {
        yield* this.getData();
        return;
    }

    public toSetDataSource(cancellationToken: CancellationToken): ReadOnlySetDataSource<T> {
        const result = new SetDataSource<T>();

        this.listenAndRepeat((change) => {
            switch (change.operation) {
                case 'add':
                    for (const item of change.items) {
                        result.add(item);
                    }
                    break;
                case 'remove':
                    for (const item of change.items) {
                        if (!this.includes(item)) {
                            result.delete(item);
                        }
                    }
                    break;
                case 'replace':
                    if (!this.includes(change.target)) {
                        result.delete(change.target);
                    }

                    for (const item of change.items) {
                        result.add(item);
                    }
                    break;

                case 'merge':
                    result.clear();
                    for (const item of change.items) {
                        result.add(item);
                    }
                    break;
            }
        }, cancellationToken);

        return result;
    }

    public toString(): string {
        return this.data.toString();
    }

    public static fromFetchText(
        response: Response,
        config: { onComplete?: () => void; itemSeperatorSequence: string } = { itemSeperatorSequence: '\n' }
    ): ArrayDataSource<string> {
        const decoder = new TextDecoder('utf-8');
        const stream = new ArrayDataSource<string>();
        const { onComplete, itemSeperatorSequence } = config;

        let buffer: string = '';
        const readerStream = response.body.getReader();
        function read(reader: ReadableStreamDefaultReader<Uint8Array>): void {
            reader.read().then(({ done, value }) => {
                if (!done) {
                    const data = (buffer + decoder.decode(value)).split(itemSeperatorSequence);
                    buffer = data.splice(data.length - 1, 1)[0];
                    stream.appendArray(data);
                    read(reader);
                } else {
                    if (buffer.length) {
                        stream.push(buffer);
                    }
                    onComplete?.();
                }
            });
        }
        read(readerStream);

        return stream;
    }

    public static fromFetchJSON<T>(
        response: Response,
        config: {
            onParseError?: (item) => T;
            onComplete?: () => void;
            itemSeperatorSequence: string;
        } = {
            itemSeperatorSequence: '\n'
        }
    ): ArrayDataSource<T> {
        const decoder = new TextDecoder('utf-8');
        const stream = new ArrayDataSource<T>();
        const { onParseError, onComplete, itemSeperatorSequence } = config;

        let buffer: string = '';
        const readerStream = response.body.getReader();
        function read(reader: ReadableStreamDefaultReader<Uint8Array>): void {
            reader.read().then(({ done, value }) => {
                if (!done) {
                    const data = (buffer + decoder.decode(value)).split(itemSeperatorSequence);
                    buffer = data.splice(data.length - 1, 1)[0];

                    for (const item of data) {
                        parseAndPush(item);
                    }

                    read(reader);
                } else {
                    if (buffer.length) {
                        parseAndPush(buffer);
                    }
                    onComplete?.();
                }
            });
        }
        read(readerStream);

        function parseAndPush(item: string) {
            try {
                stream.push(JSON.parse(item));
            } catch (e) {
                try {
                    stream.push(onParseError(item));
                } catch (e) {
                    // Ignore item if it can't be parsed and/or no error handler is provided
                }
            }
        }

        return stream;
    }

    /**
     * Connects to an aurum-server exposed array datasource. View https://github.com/CyberPhoenix90/aurum-server for more information
     * Note that type safety is not guaranteed. Whatever the server sends as an update will be propagated
     * @param  {AurumServerInfo} aurumServerInfo
     * @returns DataSource
     */
    public static fromRemoteSource<T>(aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): ArrayDataSource<T> {
        const result = new ArrayDataSource<T>();

        syncArrayDataSource(result, aurumServerInfo, cancellation);

        return result;
    }

    public static fromMultipleSources<T>(
        sources: Array<ReadOnlyArrayDataSource<T> | T[] | ReadOnlyDataSource<T>>,
        cancellationToken?: CancellationToken
    ): ReadOnlyArrayDataSource<T> {
        const boundaries = [0];
        const result = new ArrayDataSource<T>(
            undefined,
            `ArrayDataSource of (${sources.reduce((p, c) => p + (c instanceof ArrayDataSource ? c.name + ' ' : ''), '')})`
        );

        for (let i = 0; i < sources.length; i++) {
            const item = sources[i];
            if (Array.isArray(item)) {
                result.appendArray(item as T[]);
            } else if (item instanceof DataSource || item instanceof DuplexDataSource || item instanceof Stream) {
                let index = i;
                item.transform(
                    dsDiff(),
                    dsTap(({ newValue, oldValue }) => {
                        let sizeDiff = 0;
                        let oldSize = 0;
                        let newSize = 0;
                        if (Array.isArray(oldValue)) {
                            oldSize = oldValue.length;
                            sizeDiff -= oldValue.length;
                        } else if (oldValue !== undefined) {
                            oldSize = 1;
                            sizeDiff--;
                        }

                        if (Array.isArray(newValue)) {
                            sizeDiff += newValue.length;
                            newSize = newValue.length;
                        } else if (newValue !== undefined) {
                            sizeDiff++;
                            newSize = 1;
                        }

                        if (Array.isArray(newValue)) {
                            for (let i = 0; i < newValue.length; i++) {
                                if (i < oldSize) {
                                    result.set(boundaries[index] + i, newValue[i]);
                                } else {
                                    result.insertAt(boundaries[index] + i, newValue[i]);
                                }
                            }
                        } else if (newValue !== undefined) {
                            if (newSize <= oldSize) {
                                result.set(boundaries[index], newValue);
                            } else {
                                result.insertAt(boundaries[index], newValue);
                            }
                        }
                        for (let i = 0; i < oldSize - newSize; i++) {
                            result.removeAt(boundaries[index] + newSize);
                        }

                        for (let i = index + 1; i < boundaries.length; i++) {
                            boundaries[i] += sizeDiff;
                        }
                    }),
                    cancellationToken
                );
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
                            const lengthDiff = change.newState.length + change.previousState.length;
                            result.removeRange(change.index + boundaries[index], change.index + boundaries[index] + change.previousState.length);
                            result.insertAt(change.index + boundaries[index], ...change.newState);
                            if (lengthDiff != 0) {
                                for (let i = index + 1; i < boundaries.length; i++) {
                                    boundaries[i] += lengthDiff;
                                }
                            }
                            break;
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
     * Creates a new array data source where the type T is no longer wrapped by a DataSource however the values of these data sources are observed on the parent
     * array data source and changes are forwarded to the new array data source through array mutations. This makes it possible to use view methods such as map and filter
     * on the raw data instead of on data sources to cover highly dynamic use cases
     */
    public static DynamicArrayDataSourceToArrayDataSource<T>(
        arrayDataSource:
            | ReadOnlyArrayDataSource<ReadOnlyDataSource<T> | T>
            | ReadOnlyArrayDataSource<DataSource<T> | T>
            | ReadOnlyArrayDataSource<DataSource<T>>
            | ReadOnlyArrayDataSource<ReadOnlyDataSource<T>>
            | ReadOnlyArrayDataSource<GenericDataSource<T>>
            | ReadOnlyArrayDataSource<DuplexDataSource<T>>,
        cancellation: CancellationToken
    ): ReadOnlyArrayDataSource<T> {
        const result = new ArrayDataSource<T>();
        const session = new WeakMap<any, CancellationToken>();
        arrayDataSource.listenAndRepeat(({ operationDetailed, index, index2, count, items, previousState, newState, target }) => {
            switch (operationDetailed) {
                case 'append':
                    for (const item of items) {
                        listenToItem(item);
                    }
                    result.appendArray(items.map((item) => getValueOf(item)));
                    break;
                case 'prepend':
                    for (const item of items) {
                        listenToItem(item);
                    }
                    result.unshift(...items.map((item) => getValueOf(item)));
                    break;
                case 'merge':
                    for (const item of previousState) {
                        stopLitenToItem(item);
                    }
                    for (const item of newState) {
                        listenToItem(item);
                    }
                    result.merge(newState.map((i) => getValueOf(i)));
                    break;
                case 'insert':
                    for (const item of items) {
                        listenToItem(item);
                    }
                    result.insertAt(index, ...items.map((item) => getValueOf(item)));
                    break;
                case 'clear':
                    for (const item of previousState) {
                        stopLitenToItem(item);
                    }
                    result.clear();
                    break;
                case 'remove':
                    for (const item of items) {
                        stopLitenToItem(item);
                    }
                    result.removeRange(index, index + count);
                    break;
                case 'removeLeft':
                    for (const item of items) {
                        stopLitenToItem(item);
                    }
                    result.removeLeft(count);
                    break;
                case 'removeRight':
                    for (const item of items) {
                        stopLitenToItem(item);
                    }
                    result.removeRight(count);
                    break;
                case 'replace':
                    stopLitenToItem(target);
                    listenToItem(items[0]);
                    result.set(index, getValueOf(items[0]));
                    break;
                case 'swap':
                    result.swap(index, index2);
                    break;
            }
        }, cancellation);
        return result;

        function listenToItem(item: ReadOnlyDataSource<T> | T | DataSource<T> | GenericDataSource<T> | DuplexDataSource<T>) {
            if (typeof item !== 'object' || !('listen' in item)) {
                return;
            }

            session.set(item, new CancellationToken());
            cancellation.chain(session.get(item));
            item.listen((value) => {
                result.set(arrayDataSource.indexOf(item as any), value);
            }, session.get(item));
        }

        function stopLitenToItem(item: ReadOnlyDataSource<T> | T) {
            if (session.has(item)) {
                session.get(item).cancel();
                session.delete(item);
            }
        }
    }

    public static toArrayDataSource<T>(value: T[] | ArrayDataSource<T>): ArrayDataSource<T> {
        if (value instanceof ArrayDataSource) {
            return value;
        } else {
            return new ArrayDataSource(value);
        }
    }

    public pipe(target: ArrayDataSource<T>, cancellation?: CancellationToken): void {
        this.listenAndRepeat((c) => target.applyCollectionChange(c), cancellation);
    }

    /**
     * Remove all listeners
     */
    public cancelAll(): void {
        this.onItemsAdded.cancelAll();
        this.onItemsRemoved.cancelAll();
        this.updateEvent.cancelAll();
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

    /**
     * Sends a reset signal followed by an append with all items signal. This will force all the views of this source the synchronize can be useful in case your views rely on non pure transformation functions.
     */
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
     * Applies the changes described in the colleciton change to the array. Useful for synchronizing array data sources over the network or workers by serializing the changes and sending them over
     * @param collectionChange
     */
    public applyCollectionChange(collectionChange: CollectionChange<T>): void {
        switch (collectionChange.operationDetailed) {
            case 'append':
                this.appendArray(collectionChange.items);
                break;
            case 'clear':
                this.clear();
                break;
            case 'insert':
                this.insertAt(collectionChange.index, ...collectionChange.items);
                break;
            case 'merge':
                this.merge(collectionChange.items);
                break;
            case 'prepend':
                this.unshift(...collectionChange.items);
                break;
            case 'remove':
                this.removeRange(collectionChange.index, collectionChange.index + collectionChange.count);
                break;
            case 'removeLeft':
                this.removeLeft(collectionChange.count);
                break;
            case 'removeRight':
                this.removeRight(collectionChange.count);
                break;
            case 'replace':
                this.set(collectionChange.index, collectionChange.items[0]);
                break;
            case 'swap':
                this.swap(collectionChange.index, collectionChange.index2);
                break;
        }
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
        this.onItemsRemoved.fire([old]);
        this.onItemsAdded.fire([item]);

        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }
    }

    public indexOf(item: T): number {
        return this.data.indexOf(item);
    }

    public find(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg?: any): T {
        return this.data.find(predicate, thisArg);
    }

    public findIndex(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg?: any): number {
        return this.data.findIndex(predicate, thisArg);
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

        if (items.length <= 65000) {
            //Push is significantly faster than concat but it is limited to 65535 items in one push
            this.data.push.apply(this.data, items);
        } else {
            console.warn('Appending over 65000 items in one go can lead to performance issues. Consider streaming your changes progressively');
            this.data = this.data.concat(items);
        }

        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }

        this.update({
            operation: 'add',
            operationDetailed: 'append',
            count: items.length,
            index: this.data.length - items.length,
            items,
            newState: this.data
        });
        this.onItemsAdded.fire(items);
    }

    public splice(index: number, deleteCount: number, ...insertion: T[]): T[] {
        let removed = [];
        if (deleteCount > 0) {
            removed = this.removeAt(index, deleteCount);
        }

        if (insertion && insertion.length > 0) {
            this.insertAt(index, ...insertion);
        }

        return removed;
    }

    public insertAt(index: number, ...items: T[]): void {
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
        this.onItemsAdded.fire(items);
        this.lengthSource.update(this.data.length);
    }

    public push(...items: T[]) {
        this.appendArray(items);
    }

    public unshift(...items: T[]) {
        this.data.unshift(...items);
        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }
        this.update({ operation: 'add', operationDetailed: 'prepend', count: items.length, items, index: 0, newState: this.data });
        this.onItemsAdded.fire(items);
    }

    public pop(): T {
        //This could technically just call removeRight(1) but removeRight is based on splicing which creates a new array so this can be significantly faster
        const item = this.data.pop();

        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }
        this.update({
            operation: 'remove',
            operationDetailed: 'removeRight',
            count: 1,
            index: this.data.length,
            items: [item],
            newState: this.data
        });
        this.onItemsRemoved.fire([item]);

        return item;
    }

    public merge(newData: T[]): void {
        if (newData.length === 0) {
            return this.clear();
        }
        if (newData === this.data) {
            return;
        }

        const old = this.data;
        this.data = newData.slice();

        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }
        this.update({
            operation: 'merge',
            operationDetailed: 'merge',
            previousState: old,
            index: 0,
            items: this.data,
            newState: this.data
        });
        this.onItemsRemoved.fire(old);
        this.onItemsAdded.fire(this.data);
    }

    public removeRight(count: number): T[] {
        const length = this.data.length;
        const result = this.data.splice(length - count, count);
        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }
        this.update({ operation: 'remove', operationDetailed: 'removeRight', count, index: length - count, items: result, newState: this.data });
        this.onItemsRemoved.fire(result);

        return result;
    }

    public removeLeft(count: number): void {
        const removed = this.data.splice(0, count);
        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }
        this.update({ operation: 'remove', operationDetailed: 'removeLeft', count, index: 0, items: removed, newState: this.data });
        this.onItemsRemoved.fire(removed);
    }

    public removeAt(index: number, count: number = 1): T[] {
        const removed = this.data.splice(index, count);
        this.update({ operation: 'remove', operationDetailed: 'remove', count: removed.length, index, items: removed, newState: this.data });
        this.onItemsRemoved.fire(removed);
        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }

        return removed;
    }

    public removeRange(start: number, end: number): T[] {
        const removed = this.data.splice(start, end - start);
        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }
        this.update({ operation: 'remove', operationDetailed: 'remove', count: removed.length, index: start, items: removed, newState: this.data });
        this.onItemsRemoved.fire(removed);

        return removed;
    }

    public remove(item: T): T {
        const index = this.data.indexOf(item);
        if (index !== -1) {
            return this.removeAt(index)[0];
        } else {
            return undefined;
        }
    }

    public clear(): void {
        if (this.data.length === 0) {
            return;
        }

        const items = this.data;
        this.data = [];

        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }

        this.update({
            operation: 'remove',
            operationDetailed: 'clear',
            count: items.length,
            index: 0,
            items,
            previousState: items,
            newState: this.data
        });
        this.onItemsRemoved.fire(items);
    }

    public some(cb: (item: T, index: number, array: T[]) => boolean): boolean {
        return this.data.some(cb);
    }

    public every(cb: (item: T, index: number, array: T[]) => boolean): boolean {
        return this.data.every(cb);
    }

    public shift(): T {
        const item = this.data.shift();

        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }

        this.update({ operation: 'remove', operationDetailed: 'removeLeft', items: [item], count: 1, index: 0, newState: this.data });
        this.onItemsRemoved.fire([item]);

        return item;
    }

    public toArray(): T[] {
        return this.data.slice();
    }

    public flat(
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): T extends ReadOnlyArrayDataSource<infer U> ? ReadOnlyArrayDataSource<U> : ReadOnlyArrayDataSource<FlatArray<T, 1>> {
        const view = new FlattenedArrayView<any>(this as any, 1, cancellationToken, this.name + '.flat()', config);

        return view as any;
    }

    public reduce<R>(reducer: (acc: R, value: T) => R, initial?: R, cancellationToken?: CancellationToken): DataSource<R> {
        const result = new DataSource<R>(initial);

        this.listenAndRepeat((change: CollectionChange<T>) => {
            switch (change.operation) {
                case 'add':
                    let newVal = result.value;
                    for (const item of change.items) {
                        newVal = reducer(newVal, item);
                    }
                    result.update(newVal);
                    break;
                case 'merge':
                case 'replace':
                case 'swap':
                case 'remove':
                    let newVal2 = initial;
                    for (const item of change.newState) {
                        newVal2 = reducer(newVal2, item);
                    }
                    result.update(newVal2);
                    break;
            }
        }, cancellationToken);

        return result;
    }

    public reverse(cancellationToken?: CancellationToken, config?: ViewConfig): ReversedArrayView<T> {
        const view = new ReversedArrayView<T>(this, cancellationToken, this.name + '.reverse()', config);

        return view;
    }

    public sort(
        comparator: (a: T, b: T) => number = (a, b) => {
            if (a == undefined) {
                return 1;
            }

            if (b == undefined) {
                return -1;
            }

            if (typeof a === 'number' && typeof b === 'number') {
                return a - b;
            } else {
                return a.toString().localeCompare(b.toString());
            }
        },
        dependencies: ReadOnlyDataSource<any>[] = [],
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): ReadOnlyArrayDataSource<T> {
        const view = new SortedArrayView(this, comparator, cancellationToken, this.name + '.sort()', config);

        dependencies.forEach((dep) => {
            dep.listen(() => view.refresh());
        }, cancellationToken);

        return view;
    }

    public slice(
        start: number | DataSource<number>,
        end?: number | DataSource<number>,
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): ReadOnlyArrayDataSource<T> {
        if (typeof start === 'number') {
            start = new DataSource(start);
        }

        if (typeof end === 'number') {
            end = new DataSource(end);
        }

        if (end === undefined) {
            end = this.length;
        }

        return new SlicedArrayView(this, start, end, cancellationToken, this.name + '.slice()', config);
    }

    public map<D>(
        mapper: (data: T) => D,
        dependencies: ReadOnlyDataSource<any>[] = [],
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): ReadOnlyArrayDataSource<D> {
        const view = new MappedArrayView<T, D>(this, mapper, cancellationToken, this.name + '.map()', config);

        dependencies.forEach((dep) => {
            dep.listen(() => view.refresh());
        }, cancellationToken);

        return view;
    }

    public unique(cancellationToken?: CancellationToken, config?: ViewConfig): UniqueArrayView<T> {
        return new UniqueArrayView(this, cancellationToken, this.name + '.unique()', config);
    }

    public indexBy<K extends keyof T>(key: K, cancellationToken?: CancellationToken, config?: ViewConfig): MapDataSource<T[K], T> {
        const view = new MapDataSource<T[K], T>();

        this.listenAndRepeat((change) => {
            if (!config?.ignoredOperations?.includes(change.operationDetailed)) {
                switch (change.operation) {
                    case 'add':
                        for (const item of change.items) {
                            view.set(item[key], item);
                        }
                        break;
                    case 'remove':
                        for (const item of change.items) {
                            view.delete(item[key]);
                        }
                        break;
                    case 'replace':
                        view.delete(change.target[key]);
                        view.set(change.items[0][key], change.items[0]);
                        break;
                    case 'merge':
                        const oldKeys = new Set(view.keys());
                        const newKeys = new Set(change.items.map((item) => item[key]));
                        for (const oldKey of oldKeys) {
                            if (!newKeys.has(oldKey)) {
                                view.delete(oldKey);
                            }
                        }
                        for (const newKey of newKeys) {
                            if (!oldKeys.has(newKey)) {
                                view.set(
                                    newKey,
                                    change.items.find((item) => item[key] === newKey)
                                );
                            }
                        }
                        break;
                }
            }
        }, cancellationToken);
        return view;
    }

    public indexByProvider<K>(provider: (item: T) => K, cancellationToken?: CancellationToken, config?: ViewConfig): MapDataSource<K, T> {
        const view = new MapDataSource<K, T>();

        this.listenAndRepeat((change) => {
            if (!config?.ignoredOperations?.includes(change.operationDetailed)) {
                switch (change.operation) {
                    case 'add':
                        for (const item of change.items) {
                            view.set(provider(item), item);
                        }
                        break;
                    case 'remove':
                        for (const item of change.items) {
                            view.delete(provider(item));
                        }
                        break;
                    case 'replace':
                        view.delete(provider(change.target));
                        view.set(provider(change.items[0]), change.items[0]);
                        break;
                    case 'merge':
                        const oldKeys = new Set(view.keys());
                        const newKeys = new Set(change.items.map((item) => provider(item)));
                        for (const oldKey of oldKeys) {
                            if (!newKeys.has(oldKey)) {
                                view.delete(oldKey);
                            }
                        }
                        for (const newKey of newKeys) {
                            if (!oldKeys.has(newKey)) {
                                view.set(
                                    newKey,
                                    change.items.find((item) => provider(item) === newKey)
                                );
                            }
                        }
                        break;
                }
            }
        }, cancellationToken);
        return view;
    }

    public groupBy<K extends keyof T>(key: K, cancellationToken?: CancellationToken, config?: ViewConfig): MapDataSource<T[K], ReadOnlyArrayDataSource<T>> {
        const view = new MapDataSource<T[K], ArrayDataSource<T>>();

        function handleRemove(item: T) {
            const list = view.get(item[key]);
            list.splice(list.indexOf(item), 1);
            if (list.length.value === 0) {
                view.delete(item[key]);
            }
        }

        function handleAdd(item: T) {
            if (!view.has(item[key])) {
                view.set(item[key], new ArrayDataSource());
            }
            view.get(item[key]).push(item);
        }

        this.listenAndRepeat((change) => {
            if (!config?.ignoredOperations?.includes(change.operationDetailed)) {
                switch (change.operation) {
                    case 'add':
                        for (const item of change.items) {
                            handleAdd(item);
                        }
                        break;
                    case 'remove':
                        for (const item of change.items) {
                            handleRemove(item);
                        }
                        break;
                    case 'replace':
                        handleRemove(change.target);
                        handleAdd(change.items[0]);
                        break;
                    case 'merge':
                        const diff = change.previousState.filter((item) => !change.newState.includes(item));
                        for (const item of diff) {
                            if (view.has(item[key]) && view.get(item[key]).includes(item)) {
                                handleRemove(item);
                            }
                        }
                        for (const item of change.items) {
                            if (!view.has(item[key])) {
                                handleAdd(item);
                            } else {
                                if (!view.get(item[key]).includes(item)) {
                                    handleAdd(item);
                                }
                            }
                        }
                        break;
                }
            }
        }, cancellationToken);
        return view as any as MapDataSource<T[K], ReadOnlyArrayDataSource<T>>;
    }

    public groupByProvider<K>(
        provider: (item: T) => K,
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): MapDataSource<K, ReadOnlyArrayDataSource<T>> {
        const view = new MapDataSource<K, ArrayDataSource<T>>();

        function handleRemove(item: T) {
            const list = view.get(provider(item));
            list.splice(list.indexOf(item), 1);
            if (list.length.value === 0) {
                view.delete(provider(item));
            }
        }

        function handleAdd(item: T) {
            if (!view.has(provider(item))) {
                view.set(provider(item), new ArrayDataSource());
            }
            view.get(provider(item)).push(item);
        }

        this.listenAndRepeat((change) => {
            if (!config?.ignoredOperations?.includes(change.operationDetailed)) {
                switch (change.operation) {
                    case 'add':
                        for (const item of change.items) {
                            handleAdd(item);
                        }
                        break;
                    case 'remove':
                        for (const item of change.items) {
                            handleRemove(item);
                        }
                        break;
                    case 'replace':
                        handleRemove(change.target);
                        handleAdd(change.items[0]);
                        break;
                    case 'merge':
                        const diff = change.previousState.filter((item) => !change.newState.includes(item));
                        for (const item of diff) {
                            if (view.has(provider(item)) && view.get(provider(item)).includes(item)) {
                                handleRemove(item);
                            }
                        }
                        for (const item of change.items) {
                            if (!view.has(provider(item))) {
                                handleAdd(item);
                            } else {
                                if (!view.get(provider(item)).includes(item)) {
                                    handleAdd(item);
                                }
                            }
                        }
                        break;
                }
            }
        }, cancellationToken);
        return view as any as MapDataSource<K, ReadOnlyArrayDataSource<T>>;
    }

    public groupByMultiProvider<K>(
        provider: (item: T) => K[],
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): MapDataSource<K, ReadOnlyArrayDataSource<T>> {
        const view = new MapDataSource<K, ArrayDataSource<T>>();

        function handleRemove(item: T) {
            for (const i of provider(item)) {
                const list = view.get(i);
                list.splice(list.indexOf(item), 1);
                if (list.length.value === 0) {
                    view.delete(i);
                }
            }
        }

        function handleAdd(item: T) {
            for (const i of provider(item)) {
                if (!view.has(i)) {
                    view.set(i, new ArrayDataSource());
                }
                view.get(i).push(item);
            }
        }

        this.listenAndRepeat((change) => {
            if (!config?.ignoredOperations?.includes(change.operationDetailed)) {
                switch (change.operation) {
                    case 'add':
                        for (const item of change.items) {
                            handleAdd(item);
                        }
                        break;
                    case 'remove':
                        for (const item of change.items) {
                            handleRemove(item);
                        }
                        break;
                    case 'replace':
                        handleRemove(change.target);
                        handleAdd(change.items[0]);
                        break;
                    case 'merge':
                        const diff = change.previousState.filter((item) => !change.newState.includes(item));
                        for (const item of diff) {
                            for (const i of provider(item)) {
                                if (view.has(i) && view.get(i).includes(item)) {
                                    handleRemove(item);
                                }
                            }
                        }
                        for (const item of change.items) {
                            for (const i of provider(item)) {
                                if (!view.has(i)) {
                                    handleAdd(item);
                                } else {
                                    if (!view.get(i).includes(item)) {
                                        handleAdd(item);
                                    }
                                }
                            }
                        }
                        break;
                }
            }
        }, cancellationToken);
        return view as any as MapDataSource<K, ReadOnlyArrayDataSource<T>>;
    }

    public filter(
        callback: Predicate<T>,
        dependencies: ReadOnlyDataSource<any>[] = [],
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): ReadOnlyArrayDataSource<T> {
        const view = new FilteredArrayView(this, callback, cancellationToken, this.name + '.filter()', config);

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

export interface ViewConfig {
    ignoredOperations?: DetailedOperations[];
}

export class FlattenedArrayView<T> extends ArrayDataSource<T> {
    private parent: ArrayDataSource<T[]>;
    private depth: number;
    private sessionToken: CancellationToken;

    constructor(
        parent: ArrayDataSource<T[]>,
        depth: number,
        cancellationToken: CancellationToken = new CancellationToken(),
        name?: string,
        config?: ViewConfig
    ) {
        super([], name);
        this.depth = depth;
        this.parent = parent;
        this.refresh();

        parent.listen((change) => {
            if (config?.ignoredOperations?.includes(change.operationDetailed)) {
                return;
            }

            switch (change.operationDetailed) {
                case 'removeLeft':
                case 'removeRight':
                case 'remove':
                case 'swap':
                case 'replace':
                case 'insert':
                case 'merge':
                case 'prepend':
                case 'append':
                    this.refresh();
                    break;
                case 'clear':
                    this.clear();
                    break;
            }
        }, cancellationToken);
    }

    public refresh() {
        if (this.sessionToken) {
            this.sessionToken.cancel();
            this.sessionToken = undefined;
        }

        const data = this.parent.getData();
        if (data.length > 0) {
            if (data[0] instanceof ArrayDataSource) {
                this.sessionToken = new CancellationToken();
                const combination = ArrayDataSource.fromMultipleSources(data as any as ArrayDataSource<T>[]);
                combination.listen((change) => {
                    this.applyCollectionChange(change);
                }, this.sessionToken);
                this.merge(combination.getData() as any);
            } else {
                this.merge(data.flat(this.depth) as T[]);
            }
        }
    }
}

export class MappedArrayView<D, T> extends ArrayDataSource<T> {
    private parent: ArrayDataSource<D>;
    private mapper: (a: D) => T;

    constructor(
        parent: ArrayDataSource<D>,
        mapper: (a: D) => T,
        cancellationToken: CancellationToken = new CancellationToken(),
        name?: string,
        config?: ViewConfig
    ) {
        const initial = parent.getData().map(mapper);
        super(initial, name);
        this.parent = parent;
        this.mapper = mapper;

        parent.listen((change) => {
            if (config?.ignoredOperations?.includes(change.operationDetailed)) {
                return;
            }

            switch (change.operationDetailed) {
                case 'removeLeft':
                    this.removeLeft(change.count);
                    break;
                case 'removeRight':
                    this.removeRight(change.count);
                    break;
                case 'remove':
                    for (let i = 0; i < change.items.length; i++) {
                        this.remove(this.data[change.index + i]);
                    }
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
                            const index = source.indexOf(change.newState[i], i);
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
                    this.length.update(this.data.length);
                    this.update({
                        operation: 'merge',
                        operationDetailed: 'merge',
                        previousState: old,
                        index: 0,
                        items: this.data,
                        newState: this.data
                    });
                    this.onItemsRemoved.fire(old);
                    this.onItemsAdded.fire(this.data);
                    break;
            }
        }, cancellationToken);
    }

    public refresh() {
        this.merge(this.parent.getData().map(this.mapper));
    }
}

export class ReversedArrayView<T> extends ArrayDataSource<T> {
    private parent: ArrayDataSource<T>;

    constructor(parent: ArrayDataSource<T>, cancellationToken: CancellationToken = new CancellationToken(), name?: string, config?: ViewConfig) {
        const initial = parent.getData().slice().reverse();
        super(initial, name);
        this.parent = parent;

        parent.listen((change) => {
            if (config?.ignoredOperations?.includes(change.operationDetailed)) {
                return;
            }

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
        this.merge(this.parent.getData().slice().reverse());
    }
}

export class SlicedArrayView<T> extends ArrayDataSource<T> {
    constructor(
        parent: ArrayDataSource<T>,
        start: DataSource<number>,
        end: DataSource<number>,
        cancellationToken: CancellationToken = new CancellationToken(),
        name?: string,
        config?: ViewConfig
    ) {
        const initial = parent.getData().slice(start.value, end.value);
        super(initial, name);

        start.listen(() => this.merge(parent.getData().slice(start.value, end.value)), cancellationToken);
        end.listen(() => this.merge(parent.getData().slice(start.value, end.value)), cancellationToken);

        parent.listen((change) => {
            if (config?.ignoredOperations?.includes(change.operationDetailed)) {
                return;
            }

            switch (change.operationDetailed) {
                case 'removeLeft':
                case 'removeRight':
                case 'remove':
                case 'append':
                case 'prepend':
                case 'insert':
                case 'swap':
                case 'replace':
                case 'merge':
                    this.merge(parent.getData().slice(start.value, end.value));
                    break;
                case 'clear':
                    this.clear();
                    break;
            }
        }, cancellationToken);
    }
}

export class UniqueArrayView<T> extends ArrayDataSource<T> {
    constructor(parent: ArrayDataSource<T>, cancellationToken: CancellationToken = new CancellationToken(), name?: string, config?: ViewConfig) {
        const initial = Array.from(new Set(parent.getData()));
        super(initial, name);
        let filteredItems;

        parent.listen((change) => {
            if (config?.ignoredOperations?.includes(change.operationDetailed)) {
                return;
            }

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

    constructor(
        parent: ArrayDataSource<T>,
        comparator: (a: T, b: T) => number,
        cancellationToken: CancellationToken = new CancellationToken(),
        name?: string,
        config?: ViewConfig
    ) {
        const initial = parent.getData().slice().sort(comparator);
        super(initial, name);
        this.parent = parent;
        this.comparator = comparator;

        parent.listen((change) => {
            if (config?.ignoredOperations?.includes(change.operationDetailed)) {
                return;
            }

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
        if (items.length === 1 && this.data.length === 0) {
            this.push(items[0]);
        } else {
            this.merge(this.data.concat(items).sort(this.comparator));
        }
    }

    public refresh() {
        this.merge(this.parent.getData().slice().sort(this.comparator));
    }
}

export class FilteredArrayView<T> extends ArrayDataSource<T> {
    private viewFilter: Predicate<T>;
    private parent: ArrayDataSource<T>;
    constructor(
        parent: ArrayDataSource<T> | T[],
        filter?: Predicate<T>,
        cancellationToken: CancellationToken = new CancellationToken(),
        name?: string,
        config?: ViewConfig
    ) {
        if (Array.isArray(parent)) {
            parent = new ArrayDataSource(parent);
        }
        filter = filter ?? (() => true);
        const initial = (parent as FilteredArrayView<T>).data.filter(filter);
        super(initial, name);

        this.parent = parent;
        this.viewFilter = filter;
        parent.listen((change) => {
            if (config?.ignoredOperations?.includes(change.operationDetailed)) {
                return;
            }

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
            return this.data.length;
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

export interface MapChange<K, V> {
    key: K;
    oldValue: V;
    newValue: V;
    deleted?: boolean;
}

export class MapDataSource<K, V> {
    protected data: Map<K, V>;
    private updateEvent: EventEmitter<MapChange<K, V>>;
    private updateEventOnKey: Map<K, EventEmitter<MapChange<K, V>>>;

    constructor(initialData?: Map<K, V>) {
        this.data = initialData ?? new Map();

        this.updateEvent = new EventEmitter();
        this.updateEventOnKey = new Map();
    }

    public cancelAll(): void {
        this.updateEvent.cancelAll();
        this.updateEventOnKey.forEach((v, k) => v.cancelAll());
        this.updateEventOnKey.clear();
    }

    /**
     * Connects to an aurum-server exposed map datasource. View https://github.com/CyberPhoenix90/aurum-server for more information
     * Note that type safety is not guaranteed. Whatever the server sends as an update will be propagated. Make sure you trust the server
     * @param  {AurumServerInfo} aurumServerInfo
     * @returns DataSource
     */
    public static fromRemoteSource<K, V>(aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): MapDataSource<K, V> {
        const result = new MapDataSource<K, V>();

        syncMapDataSource(result, aurumServerInfo, cancellation);

        return result;
    }

    public static fromMultipleMaps<K, V>(maps: MapDataSource<K, V>[], cancellationToken?: CancellationToken): MapDataSource<K, V> {
        const result = new MapDataSource<K, V>();
        let i = 0;
        for (const map of maps) {
            let index = i;
            result.assign(map);
            map.listen((change) => {
                let isOverwritten = false;
                for (let j = index + 1; j < maps.length; j++) {
                    if (maps[j].has(change.key)) {
                        isOverwritten = true;
                        break;
                    }
                }
                if (!isOverwritten) {
                    if (change.deleted) {
                        result.delete(change.key);
                    } else {
                        result.set(change.key, change.newValue);
                    }
                }
            }, cancellationToken);
        }

        return result;
    }

    public pipe(target: MapDataSource<K, V>, cancellation?: CancellationToken): void {
        this.listenAndRepeat((c) => target.applyMapChange(c), cancellation);
    }

    public forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        this.data.forEach(callbackfn, thisArg);
    }

    public toString(): string {
        return this.data.toString();
    }

    public static toMapDataSource<K, V>(value: Map<K, V> | MapDataSource<K, V>): MapDataSource<K, V> {
        if (value instanceof MapDataSource) {
            return value;
        } else {
            return new MapDataSource(value);
        }
    }

    public applyMapChange(change: MapChange<K, V>) {
        if (change.deleted && this.data.has(change.key)) {
            this.delete(change.key);
        } else if (!change.deleted && !this.data.has(change.key)) {
            this.set(change.key, change.newValue);
        }
    }

    /**
     * Creates a datasource for a single key of the object
     * @param key
     * @param cancellationToken
     */
    public pick(key: K, cancellationToken?: CancellationToken): DataSource<V> {
        const subDataSource: DataSource<V> = new DataSource(this.data.get(key));

        this.listenOnKey(
            key,
            (v) => {
                subDataSource.update(v.newValue);
            },
            cancellationToken
        );

        return subDataSource;
    }

    /**
     * Listen to changes of the object
     */
    public listen(callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): Callback<void> {
        return this.updateEvent.subscribe(callback, cancellationToken).cancel;
    }

    /**
     * Same as listen but will immediately call the callback with the current value of each key
     */
    public listenAndRepeat(callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): Callback<void> {
        const c = this.updateEvent.subscribe(callback, cancellationToken).cancel;
        for (const key of this.data.keys()) {
            callback({
                key,
                newValue: this.data.get(key),
                oldValue: undefined,
                deleted: false
            });
        }
        return c;
    }

    public map<D>(mapper: (key: K, value: V, valueLifetimeToken: CancellationToken) => D, cancellation: CancellationToken): MapDataSource<K, D> {
        const result = new MapDataSource<K, D>();
        const lifeTimeMap = new Map<K, CancellationToken>();
        this.listenAndRepeat((change) => {
            if (change.deleted) {
                lifeTimeMap.get(change.key).cancel();
                lifeTimeMap.delete(change.key);
                result.delete(change.key);
            } else {
                const lifeTimeToken = new CancellationToken();
                if (lifeTimeMap.has(change.key)) {
                    lifeTimeMap.get(change.key).cancel();
                }
                lifeTimeMap.set(change.key, lifeTimeToken);
                const newItem = mapper(change.key, change.newValue, lifeTimeToken);
                result.set(change.key, newItem);
            }
        }, cancellation);
        return result;
    }

    public toArrayDataSource(cancellation: CancellationToken): ArrayDataSource<V> {
        const stateMap: Map<K, V> = new Map<K, V>();
        const result = new ArrayDataSource<V>();
        this.listenAndRepeat((change) => {
            if (change.deleted && stateMap.has(change.key)) {
                const item = stateMap.get(change.key);
                result.remove(item);
                stateMap.delete(change.key);
            } else if (stateMap.has(change.key)) {
                const newItem = change.newValue;
                result.replace(stateMap.get(change.key), newItem);
                stateMap.set(change.key, newItem);
            } else if (!stateMap.has(change.key) && !change.deleted) {
                const newItem = change.newValue;
                result.push(newItem);
                stateMap.set(change.key, newItem);
            }
        }, cancellation);

        return result;
    }

    public clear() {
        for (const key of this.data.keys()) {
            this.delete(key);
        }
    }

    /**
     * Same as listenOnKey but will immediately call the callback with the current value first
     */
    public listenOnKeyAndRepeat(key: K, callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): Callback<void> {
        callback({
            key,
            newValue: this.data.get(key),
            oldValue: undefined
        });

        return this.listenOnKey(key, callback, cancellationToken);
    }

    /**
     * Listen to changes of a single key of the object
     */
    public listenOnKey(key: K, callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): Callback<void> {
        if (!this.updateEventOnKey.has(key)) {
            this.updateEventOnKey.set(key, new EventEmitter());
        }
        const event = this.updateEventOnKey.get(key);
        return event.subscribe(callback, cancellationToken).cancel;
    }

    /**
     * Returns all the keys of the object in the source
     */
    public keys(): IterableIterator<K> {
        return this.data.keys();
    }

    /**
     * Returns all the values of the object in the source
     */
    public values(): IterableIterator<V> {
        return this.data.values();
    }

    /**
     * get the current value of a key of the object
     * @param key
     */
    public get(key: K): V {
        return this.data.get(key);
    }

    /**
     * check if map has a key
     * @param key
     */
    public has(key: K): boolean {
        return this.data.has(key);
    }

    /**
     * delete a key from the object
     * @param key
     * @param value
     */
    public delete(key: K): void {
        if (!this.has(key)) {
            return;
        }

        const old = this.data.get(key);
        this.data.delete(key);
        this.updateEvent.fire({ oldValue: old, key, newValue: undefined, deleted: true });
        if (this.updateEventOnKey.has(key)) {
            this.updateEventOnKey.get(key).fire({ oldValue: old, key, newValue: undefined });
        }
    }

    /**
     * set the value for a key of the object
     * @param key
     * @param value
     */
    public set(key: K, value: V): void {
        if (this.data.get(key) === value) {
            return;
        }

        const old = this.data.get(key);
        this.data.set(key, value);
        this.updateEvent.fire({ oldValue: old, key, newValue: this.data.get(key) });
        if (this.updateEventOnKey.has(key)) {
            this.updateEventOnKey.get(key).fire({ oldValue: old, key, newValue: this.data.get(key) });
        }
    }

    /**
     * Merge the key value pairs of an object into this object non recursively
     * @param newData
     */
    public assign(newData: Map<K, V> | MapDataSource<K, V>): void {
        for (const key of newData.keys()) {
            this.set(key, newData.get(key));
        }
    }

    /**
     * Returns a shallow copy of the map
     */
    public toMap(): Map<K, V> {
        return new Map(this.data.entries());
    }
}

export interface SetChange<K> {
    key: K;
    exists: boolean;
}

export interface ReadOnlySetDataSource<K> {
    difference(otherSet: ReadOnlySetDataSource<K>, cancellationToken: CancellationToken): ReadOnlySetDataSource<K>;
    union(otherSet: ReadOnlySetDataSource<K>, cancellationToken: CancellationToken): ReadOnlySetDataSource<K>;
    intersection(otherSet: ReadOnlySetDataSource<K>, cancellationToken: CancellationToken): ReadOnlySetDataSource<K>;
    symmetricDifference(otherSet: ReadOnlySetDataSource<K>, cancellationToken: CancellationToken): ReadOnlySetDataSource<K>;

    isSubsetOf(otherSet: ReadOnlySetDataSource<K> | Set<K>): boolean;
    isSupersetOf(otherSet: ReadOnlySetDataSource<K> | Set<K>): boolean;
    isDisjointWith(otherSet: ReadOnlySetDataSource<K> | Set<K>): boolean;
    isIdenticalTo(otherSet: ReadOnlySetDataSource<K> | Set<K>): boolean;

    pick(key: K, cancellationToken?: CancellationToken): DataSource<boolean>;
    listen(callback: Callback<SetChange<K>>, cancellationToken?: CancellationToken): Callback<void>;
    listenAndRepeat(callback: Callback<SetChange<K>>, cancellationToken?: CancellationToken): Callback<void>;
    listenOnKeyAndRepeat(key: K, callback: Callback<boolean>, cancellationToken?: CancellationToken): Callback<void>;
    listenOnKey(key: K, callback: Callback<boolean>, cancellationToken?: CancellationToken): Callback<void>;
    map<D>(mapper: (key: K) => D): ReadOnlyArrayDataSource<D>;
    keys(): IterableIterator<K>;
    has(key: K): boolean;
    toArray(): K[];
    toArrayDataSource(cancellationToken?: CancellationToken): ReadOnlyArrayDataSource<K>;
    toSet(): Set<K>;
    clear(): void;
    [Symbol.iterator](): IterableIterator<K>;
    entries(): IterableIterator<[K, K]>;
    values(): IterableIterator<K>;
    readonly size: number;
}
export class SetDataSource<K> implements ReadOnlySetDataSource<K> {
    protected data: Set<K>;
    private updateEvent: EventEmitter<SetChange<K>>;
    private updateEventOnKey: Map<K, EventEmitter<boolean>>;

    constructor(initialData?: Set<K> | K[]) {
        if (Array.isArray(initialData)) {
            this.data = new Set(initialData);
        } else {
            this.data = initialData ?? new Set();
        }

        this.updateEvent = new EventEmitter();
        this.updateEventOnKey = new Map();
    }

    /**
     * Connects to an aurum-server exposed set datasource. View https://github.com/CyberPhoenix90/aurum-server for more information
     * Note that type safety is not guaranteed. Whatever the server sends as an update will be propagated. Make sure you trust the server
     * @param  {AurumServerInfo} aurumServerInfo
     * @returns DataSource
     */
    public static fromRemoteSource<T>(aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): SetDataSource<T> {
        const result = new SetDataSource<T>(undefined);

        syncSetDataSource(result, aurumServerInfo, cancellation);

        return result;
    }

    /**
     * Remove all listeners
     */
    public cancelAll(): void {
        this.updateEvent.cancelAll();
    }

    public applySetChange(change: SetChange<K>): void {
        if (change.exists && !this.has(change.key)) {
            this.data.add(change.key);
        } else if (!change.exists && this.has(change.key)) {
            this.data.delete(change.key);
        }
    }

    public clear(): void {
        for (const key of this.data.keys()) {
            this.delete(key);
        }
    }

    public isSubsetOf(otherSet: ReadOnlySetDataSource<K> | Set<K>): boolean {
        for (const key of this) {
            if (!otherSet.has(key)) {
                return false;
            }
        }

        return true;
    }

    public isSupersetOf(otherSet: ReadOnlySetDataSource<K> | Set<K>): boolean {
        for (const key of otherSet) {
            if (!this.has(key)) {
                return false;
            }
        }

        return true;
    }

    public isDisjointWith(otherSet: ReadOnlySetDataSource<K> | Set<K>): boolean {
        for (const key of otherSet) {
            if (this.has(key)) {
                return false;
            }
        }

        return true;
    }

    public get size(): number {
        return this.data.size;
    }

    public isIdenticalTo(otherSet: ReadOnlySetDataSource<K> | Set<K>): boolean {
        if (this.size !== otherSet.size) {
            return false;
        }

        for (const key of otherSet) {
            if (!this.has(key)) {
                return false;
            }
        }

        return true;
    }

    public static toSetDataSource<K>(value: Set<K> | SetDataSource<K>): SetDataSource<K> {
        if (value instanceof SetDataSource) {
            return value;
        } else {
            return new SetDataSource(value);
        }
    }

    public [Symbol.iterator](): IterableIterator<K> {
        return this.data.keys();
    }
    /**
     * Returns an iterable of [v,v] pairs for every value `v` in the set.
     */
    public entries(): IterableIterator<[K, K]> {
        return this.data.entries();
    }

    /**
     * Returns an iterable of values in the set.
     */
    public values(): IterableIterator<K> {
        return this.data.values();
    }

    public difference(otherSet: ReadOnlySetDataSource<K>, cancellationToken: CancellationToken): ReadOnlySetDataSource<K> {
        const result = new SetDataSource<K>();
        const otherSetKeys = new Set<K>(otherSet.keys());
        this.listenAndRepeat((change) => {
            if (change.exists && !otherSetKeys.has(change.key)) {
                result.add(change.key);
            }

            if (!change.exists) {
                result.delete(change.key);
            }
        }, cancellationToken);

        otherSet.listenAndRepeat((change) => {
            if (change.exists) {
                result.delete(change.key);
            }

            if (!change.exists && this.has(change.key)) {
                result.add(change.key);
            }
        }, cancellationToken);

        return result;
    }

    public union(otherSet: ReadOnlySetDataSource<K>, cancellationToken: CancellationToken): ReadOnlySetDataSource<K> {
        const result = new SetDataSource<K>();

        this.listenAndRepeat((change) => {
            if (change.exists) {
                result.add(change.key);
            } else if (!otherSet.has(change.key)) {
                result.delete(change.key);
            }
        }, cancellationToken);

        otherSet.listenAndRepeat((change) => {
            if (change.exists) {
                result.add(change.key);
            } else if (!this.has(change.key)) {
                result.delete(change.key);
            }
        }, cancellationToken);

        return result;
    }

    public intersection(otherSet: ReadOnlySetDataSource<K>, cancellationToken: CancellationToken): ReadOnlySetDataSource<K> {
        const result = new SetDataSource<K>();

        this.listenAndRepeat((change) => {
            if (change.exists && otherSet.has(change.key)) {
                result.add(change.key);
            } else {
                result.delete(change.key);
            }
        }, cancellationToken);

        otherSet.listenAndRepeat((change) => {
            if (change.exists && this.has(change.key)) {
                result.add(change.key);
            } else {
                result.delete(change.key);
            }
        }, cancellationToken);

        return result;
    }

    public symmetricDifference(otherSet: ReadOnlySetDataSource<K>, cancellationToken: CancellationToken): ReadOnlySetDataSource<K> {
        const result = new SetDataSource<K>();

        this.listenAndRepeat((change) => {
            if (change.exists && !otherSet.has(change.key)) {
                result.add(change.key);
            } else if (!change.exists && otherSet.has(change.key)) {
                result.add(change.key);
            } else if (change.exists && otherSet.has(change.key)) {
                result.delete(change.key);
            } else if (!change.exists && !otherSet.has(change.key)) {
                result.delete(change.key);
            }
        }, cancellationToken);

        otherSet.listenAndRepeat((change) => {
            if (change.exists && !this.has(change.key)) {
                result.add(change.key);
            } else if (!change.exists && this.has(change.key)) {
                result.add(change.key);
            } else if (change.exists && this.has(change.key)) {
                result.delete(change.key);
            } else if (!change.exists && !this.has(change.key)) {
                result.delete(change.key);
            }
        }, cancellationToken);

        return result;
    }

    public toString(): string {
        return this.data.toString();
    }

    /**
     * Creates a datasource for a single key of the object
     * @param key
     * @param cancellationToken
     */
    public pick(key: K, cancellationToken?: CancellationToken): DataSource<boolean> {
        const subDataSource: DataSource<boolean> = new DataSource(this.data.has(key));

        this.listenOnKey(
            key,
            (v) => {
                subDataSource.update(v);
            },
            cancellationToken
        );

        return subDataSource;
    }

    /**
     * Listen to changes of the object
     */
    public listen(callback: Callback<SetChange<K>>, cancellationToken?: CancellationToken): Callback<void> {
        return this.updateEvent.subscribe(callback, cancellationToken).cancel;
    }

    /**
     * Same as listen but will immediately call the callback with the current value of each key
     */
    public listenAndRepeat(callback: Callback<SetChange<K>>, cancellationToken?: CancellationToken): Callback<void> {
        const c = this.updateEvent.subscribe(callback, cancellationToken).cancel;
        for (const key of this.data.keys()) {
            callback({
                key,
                exists: true
            });
        }
        return c;
    }

    /**
     * Same as listenOnKey but will immediately call the callback with the current value first
     */
    public listenOnKeyAndRepeat(key: K, callback: Callback<boolean>, cancellationToken?: CancellationToken): Callback<void> {
        callback(this.has(key));

        return this.listenOnKey(key, callback, cancellationToken);
    }

    /**
     * Listen to changes of a single key of the object
     */
    public listenOnKey(key: K, callback: Callback<boolean>, cancellationToken?: CancellationToken): Callback<void> {
        if (!this.updateEventOnKey.has(key)) {
            this.updateEventOnKey.set(key, new EventEmitter());
        }
        const event = this.updateEventOnKey.get(key);
        return event.subscribe(callback, cancellationToken).cancel;
    }

    public toArrayDataSource(cancellationToken?: CancellationToken): ReadOnlyArrayDataSource<K> {
        return this.map((key) => key, cancellationToken);
    }

    public map<D>(mapper: (key: K) => D, cancellationToken?: CancellationToken): ReadOnlyArrayDataSource<D> {
        const stateMap: Map<K, D> = new Map<K, D>();
        const result = new ArrayDataSource<D>();
        this.listenAndRepeat((change) => {
            if (!change.exists && stateMap.has(change.key)) {
                const item = stateMap.get(change.key);
                result.remove(item);
                stateMap.delete(change.key);
            } else if (!stateMap.has(change.key) && change.exists) {
                const newItem = mapper(change.key);
                result.push(newItem);
                stateMap.set(change.key, newItem);
            }
        }, cancellationToken);

        return result;
    }

    /**
     * Returns all the keys of the object in the source
     */
    public keys(): IterableIterator<K> {
        return this.data.keys();
    }

    /**
     * check if map has a key
     * @param key
     */
    public has(key: K): boolean {
        return this.data.has(key);
    }

    /**
     * delete a key from the object
     * @param key
     * @param value
     */
    public delete(key: K): void {
        if (this.has(key)) {
            this.data.delete(key);
            this.updateEvent.fire({ key, exists: false });
            if (this.updateEventOnKey.has(key)) {
                this.updateEventOnKey.get(key).fire(false);
            }
        }
    }

    /**
     * set the value for a key of the object
     * @param key
     * @param value
     */
    public add(key: K): void {
        if (this.data.has(key)) {
            return;
        }
        this.data.add(key);
        this.updateEvent.fire({ key, exists: true });
        if (this.updateEventOnKey.has(key)) {
            this.updateEventOnKey.get(key).fire(true);
        }
    }

    /**
     * Merge the key value pairs of an object into this object non recursively
     * @param newData
     */
    public assign(newData: Set<K> | SetDataSource<K>): void {
        for (const key of newData.keys()) {
            this.add(key);
        }
    }

    /**
     * Returns a shallow copy of the set
     */
    public toSet(): Set<K> {
        return new Set(this.data.keys());
    }

    public toArray(): K[] {
        return Array.from(this.data.keys());
    }
}
