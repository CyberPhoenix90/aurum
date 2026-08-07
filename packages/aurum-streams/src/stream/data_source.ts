import { CancellationToken } from '../utilities/cancellation_token.js';
import { Callback, DataPublisher, DataWriter, Predicate } from '../utilities/common.js';
import { EventEmitter } from '../utilities/event_emitter.js';
import { promiseIterator, readableStreamStringIterator, transformAsyncIterator } from '../utilities/iteration.js';
import {
    AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED,
    emitAurumDevtoolsUpdate,
    linkAurumDevtoolsNodes,
    registerAurumDevtoolsNode,
    setAurumDevtoolsSubscriptionCount,
    updateAurumDevtoolsNode
} from '../devtools.js';
import { dsDiff, dsMap, dsTap } from './data_source_operators.js';
import {
    DataSourceDelayFilterOperator,
    DataSourceFilterOperator,
    DataSourceMapDelayFilterOperator,
    DataSourceMapOperator,
    DataSourceOperator,
    DataSourceOperatorOutput,
    DataSourceTransformRestArguments,
    DataSourceSpreadOperator,
    OperationType
} from './operator_model.js';

export interface ReadOnlyDataSource<T> {
    readonly value: T;
    readonly name: string;
    listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): void;
    listen(callback: Callback<T>, cancellationToken?: CancellationToken): void;
    listenOnce(callback: Callback<T>, cancellationToken?: CancellationToken): void;
    onError(callback: Callback<Error>, cancellationToken?: CancellationToken): void;
    awaitNextUpdate(cancellationToken?: CancellationToken): Promise<T>;
    /** Resolves with the current or next matching value. By default, null and undefined are skipped. */
    awaitValue(cancellationToken?: CancellationToken): Promise<NonNullable<T>>;
    awaitValue(predicate: undefined, cancellationToken?: CancellationToken): Promise<NonNullable<T>>;
    awaitValue<S extends T>(predicate: (value: T) => value is S, cancellationToken?: CancellationToken): Promise<S>;
    awaitValue(predicate: (value: T) => boolean, cancellationToken?: CancellationToken): Promise<T>;
    combine(otherSources: ReadOnlyDataSource<T>[], cancellationToken?: CancellationToken): DataSource<T>;
    aggregate<R, A>(otherSources: [ReadOnlyDataSource<A>], combinator: (self: T, other: A) => R, cancellationToken?: CancellationToken): DataSource<R>;
    aggregate<R, A, B>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>],
        combinator: (self: T, second: A, third: B) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    aggregate<R, A, B, C>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>],
        combinator: (self: T, second: A, third: B, fourth: C) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    aggregate<R, A, B, C, D>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>],
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    aggregate<R, A, B, C, D, E>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>, ReadOnlyDataSource<E>],
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E) => R,
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
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F) => R,
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
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G) => R,
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
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H) => R,
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
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H, tenth: I) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    aggregate<R>(otherSources: ReadOnlyDataSource<any>[], combinator: (...data: any[]) => R, cancellationToken?: CancellationToken): DataSource<R>;

    pipe(targetDataSource: DataSource<T>, cancellationToken?: CancellationToken): this;
    transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G>(
        first: DataSourceOperator<T, A>, second?: DataSourceOperator<A, B> | CancellationToken,
        third?: DataSourceOperator<B, C> | CancellationToken, fourth?: DataSourceOperator<C, D> | CancellationToken,
        fifth?: DataSourceOperator<D, E> | CancellationToken, sixth?: DataSourceOperator<E, F> | CancellationToken,
        seventh?: DataSourceOperator<F, G> | CancellationToken, eighth?: DataSourceOperator<G, H> | CancellationToken,
        cancellationToken?: CancellationToken
    ): ReadOnlyDataSource<H>;
    transform<FirstOutput, const Operators extends readonly DataSourceOperator<any, any>[]>(
        first: DataSourceOperator<T, FirstOutput>,
        ...operations: DataSourceTransformRestArguments<FirstOutput, Operators>
    ): ReadOnlyDataSource<DataSourceOperatorOutput<FirstOutput, Operators>>;
}

export type BindableSource<T> = ReadOnlyDataSource<T> & DataWriter<T>;
export type MutableSource<T> = ReadOnlyDataSource<T> & DataWriter<T> & DataPublisher<T>;

export interface GenericDataSource<T> extends ReadOnlyDataSource<T> {
    readonly value: T;
    readonly name: string;
    listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): void;
    listen(callback: Callback<T>, cancellationToken?: CancellationToken): void;
    listenOnce(callback: Callback<T>, cancellationToken?: CancellationToken): void;
    awaitNextUpdate(cancellationToken?: CancellationToken): Promise<T>;
    withInitial(value: T): this;
    aggregate<R, A>(otherSources: [ReadOnlyDataSource<A>], combinator: (self: T, other: A) => R, cancellationToken?: CancellationToken): DataSource<R>;
    aggregate<R, A, B>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>],
        combinator: (self: T, second: A, third: B) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    aggregate<R, A, B, C>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>],
        combinator: (self: T, second: A, third: B, fourth: C) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    aggregate<R, A, B, C, D>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>],
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    aggregate<R, A, B, C, D, E>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>, ReadOnlyDataSource<E>],
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E) => R,
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
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F) => R,
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
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G) => R,
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
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H) => R,
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
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H, tenth: I) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    aggregate<R>(otherSources: ReadOnlyDataSource<any>[], combinator: (...data: any[]) => R, cancellationToken?: CancellationToken): DataSource<R>;
    transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G>(
        first: DataSourceOperator<T, A>, second?: DataSourceOperator<A, B> | CancellationToken,
        third?: DataSourceOperator<B, C> | CancellationToken, fourth?: DataSourceOperator<C, D> | CancellationToken,
        fifth?: DataSourceOperator<D, E> | CancellationToken, sixth?: DataSourceOperator<E, F> | CancellationToken,
        seventh?: DataSourceOperator<F, G> | CancellationToken, eighth?: DataSourceOperator<G, H> | CancellationToken,
        cancellationToken?: CancellationToken
    ): DataSource<H>;
    transform<FirstOutput, const Operators extends readonly DataSourceOperator<any, any>[]>(
        first: DataSourceOperator<T, FirstOutput>,
        ...operations: DataSourceTransformRestArguments<FirstOutput, Operators>
    ): DataSource<DataSourceOperatorOutput<FirstOutput, Operators>>;
}

/**
 * Datasources wrap a value and allow you to update it in an observable way. Datasources can be manipulated like streams and can be bound directly in the JSX syntax and will update the html whenever the value changes
 */
export class DataSource<T> implements GenericDataSource<T>, ReadOnlyDataSource<T>, DataWriter<T>, DataPublisher<T> {
    /**
     * The current value of this data source, can be changed through update
     */
    public value: T;
    protected primed: boolean;
    protected updating: boolean;
    public name: string;
    protected updateEvent: EventEmitter<T>;
    protected errorHandler: (error: any) => T;
    protected errorEvent: EventEmitter<Error>;

    constructor(initialValue?: T, name: string = 'RootDataSource') {
        this.name = name;
        this.value = initialValue;
        this.primed = initialValue !== undefined;
        this.errorEvent = new EventEmitter();
        this.updateEvent = new EventEmitter();
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            registerAurumDevtoolsNode(this, {
                kind: 'data-source',
                name,
                getValue: (target) => target.value
            });
        }
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            this.updateEvent.observeSubscriptionCount((count) => setAurumDevtoolsSubscriptionCount(this, count), false);
            this.errorEvent.observeSubscriptionCount((count) => setAurumDevtoolsSubscriptionCount(this, count, 'errors'), false);
        }
    }

    public toString(): string {
        return `${this.name}<${this.value.toString()}>`;
    }

    public static toDataSource<T>(value: T | DataSource<T>): DataSource<T> {
        if (value instanceof DataSource) {
            return value;
        } else {
            return new DataSource(value);
        }
    }

    public static fromFetchText(response: Response, config: FetchStreamConfig = { itemSeperatorSequence: '\n' }): DataSource<string> {
        return DataSource.fromAsyncIterator(
            readableStreamStringIterator(response.body.getReader(), config.itemSeperatorSequence, config.onComplete),
            undefined
        );
    }

    public static fromFetchJSON<T>(
        response: Response,
        config: FetchStreamConfig & {
            onParseError?: (error: Error, item: string) => T;
        } = {
            itemSeperatorSequence: '\n'
        }
    ): DataSource<T> {
        return DataSource.fromAsyncIterator(
            transformAsyncIterator(
                readableStreamStringIterator(response.body.getReader(), config.itemSeperatorSequence, config.onComplete),
                dsMap((v) => {
                    try {
                        return JSON.parse(v);
                    } catch (e) {
                        if (config.onParseError) {
                            return config.onParseError(e, v);
                        } else {
                            throw e;
                        }
                    }
                })
            )
        );
    }

    public static fromEvent<T>(event: EventEmitter<T>, cancellation: CancellationToken): DataSource<T> {
        const result = new DataSource<T>();
        event.subscribe((v) => result.update(v), cancellation);
        return result;
    }

    /**
     * Creates a new `DataSource` from a callback function.
     * The callback function is expected to take an `update` function as a parameter,
     * which can be used to update the value of the `DataSource`.
     * This is useful to create a `DataSource` that is updated with an event such as a button click.
     * @example ```typescript
     * const buttonClicks = DataSource.fromCallback((update) => {
     *    button.addEventListener('click', update);
     * });
     * ```
     *
     * @template T - The type of the value emitted by the `DataSource`.
     * @param callback - The callback function that provides the `update` function.
     * @param cancellation - The cancellation token used to cancel the `DataSource`.
     * @returns A new `DataSource` instance.
     */
    public static fromCallback<T>(callback: (update: (value: T) => void, token: CancellationToken) => void, cancellation: CancellationToken): DataSource<T> {
        const result = new DataSource<T>();
        callback(result.update.bind(result), cancellation);
        return result;
    }

    public static fromDomEvent<T extends Event>(
        element: {
            addEventListener: (event: string, cb: (e: T) => void) => void;
            removeEventListener: (event: string, cb: (e: T) => void) => void;
        },
        event: string,
        cancellation: CancellationToken
    ): DataSource<T> {
        const result = new DataSource<T>();
        cancellation.registerDomEvent(element, event, (e) => result.update(e as T));
        return result;
    }

    public static fromNodeJsEvent<T>(
        emitter: {
            on(event: string, listener: (value: T) => void): void;
            off(event: string, listener: (value: T) => void): void;
        },
        event: string,
        cancellation: CancellationToken
    ): DataSource<T> {
        const result = new DataSource<T>();
        const listener = (value: T) => result.update(value);
        emitter.on(event, listener);
        cancellation.addCancellable(() => emitter.off(event, listener));
        return result;
    }

    public static fromMultipleSources<T>(sources: ReadOnlyDataSource<T>[], cancellation?: CancellationToken): DataSource<T> {
        const result = new DataSource<T>();

        for (const s of sources) {
            linkAurumDevtoolsNodes(s as object, result, { kind: 'combine' }, cancellation);
            s.listen((v: T) => result.update(v), cancellation);
        }

        result.name = `Combination of [${sources.map((v) => v.name).join(' & ')}]`;
        updateAurumDevtoolsNode(result, { name: result.name, metadata: { sourceCount: sources.length } });

        return result;
    }

    public static fromAsyncIterator<T>(iterator: AsyncIterableIterator<T>, cancellation?: CancellationToken): DataSource<T> {
        const result = new DataSource<T>();

        (async () => {
            try {
                for await (const item of iterator) {
                    if (cancellation?.isCancelled) {
                        return;
                    }
                    result.update(item);
                }
            } catch (e) {
                result.emitError(e);
            }
        })();

        return result;
    }

    public static fromPromise<T>(promise: Promise<T>, cancellation?: CancellationToken): DataSource<T> {
        const result = new DataSource<T>();

        promise.then((v) => {
            if (cancellation?.isCancelled) {
                return;
            }
            result.update(v);
        }, result.emitError.bind(result));

        return result;
    }

    public static fromPromiseArray<T>(promises: Promise<T>[], cancellation?: CancellationToken): DataSource<T> {
        const result = new DataSource<T>();

        (async () => {
            for await (const promise of promiseIterator(promises, cancellation)) {
                if (cancellation?.isCancelled) {
                    return;
                }
                if (promise.status === 'fulfilled') {
                    result.update(promise.value);
                } else {
                    result.emitError(promise.reason);
                }
            }
        })();

        return result;
    }

    public toAsyncIterator(cancellation?: CancellationToken): AsyncIterableIterator<T> {
        return this.updateEvent.toAsyncIterator(this.errorEvent, cancellation);
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
        emitAurumDevtoolsUpdate(this, { kind: 'error', value: e });
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
     * If the datasource was never updated this will wait until the first update otherwise it will return the current value
     */
    public async getValueWhenAvailable(): Promise<T> {
        if (this.primed) {
            return this.value;
        } else {
            return await this.awaitNextUpdate();
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
        if (newValue === this) {
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
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            emitAurumDevtoolsUpdate(this, { kind: 'update', value: newValue });
        }
        try {
            this.updateEvent.fire(newValue);
        } finally {
            this.updating = false;
        }
    }

    /** Consumer-originated writes and source publications are equivalent for a one-way source. */
    public write(newValue: T): void {
        this.update(newValue);
    }

    public publish(newValue: T): void {
        this.update(newValue);
    }

    public updateIfChanged(newValue: T): void {
        if (newValue !== this.value) {
            this.update(newValue);
        }
    }

    public updateWith(fn: (oldValue: T) => T): void {
        this.update(fn(this.value));
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
    public listenAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): void {
        if (this.primed) {
            callback(this.value);
        }
        this.listen(callback, cancellationToken);
    }

    /**
     * Subscribes to the updates of the data stream
     * @param callback Callback to call when value is updated
     * @param cancellationToken Optional token to control the cancellation of the subscription
     * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
     */
    public listen(callback: Callback<T>, cancellationToken?: CancellationToken): void {
        this.updateEvent.subscribe(callback, cancellationToken);
    }

    /**
     * Subscribes to the updates of the data stream for a single update
     * @param callback Callback to call when value is updated
     * @param cancellationToken Optional token to control the cancellation of the subscription
     * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
     */
    public listenOnce(callback: Callback<T>, cancellationToken?: CancellationToken): void {
        this.updateEvent.subscribeOnce(callback, cancellationToken);
    }

    public transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G>(
        first: DataSourceOperator<T, A>, second?: DataSourceOperator<A, B> | CancellationToken,
        third?: DataSourceOperator<B, C> | CancellationToken, fourth?: DataSourceOperator<C, D> | CancellationToken,
        fifth?: DataSourceOperator<D, E> | CancellationToken, sixth?: DataSourceOperator<E, F> | CancellationToken,
        seventh?: DataSourceOperator<F, G> | CancellationToken, eighth?: DataSourceOperator<G, H> | CancellationToken,
        cancellationToken?: CancellationToken
    ): DataSource<H>;
    public transform<FirstOutput, const Operators extends readonly DataSourceOperator<any, any>[]>(
        first: DataSourceOperator<T, FirstOutput>,
        ...rest: DataSourceTransformRestArguments<FirstOutput, Operators>
    ): DataSource<DataSourceOperatorOutput<FirstOutput, Operators>>;
    public transform(first: DataSourceOperator<T, any>, ...rest: Array<DataSourceOperator<any, any> | CancellationToken>): DataSource<any> {
        const args: Array<DataSourceOperator<any, any> | CancellationToken> = [first, ...rest];
        const lastArgument = args[args.length - 1];
        const suppliedToken = lastArgument instanceof CancellationToken ? lastArgument : undefined;
        const token = suppliedToken ?? new CancellationToken();
        const definitions = (suppliedToken ? args.slice(0, -1) : args).filter(Boolean) as DataSourceOperator<any, any>[];
        const operations = definitions.map((operation) => operation.bind?.({ cancellationToken: token }) ?? operation);
        const result = new DataSource<any>(undefined, this.name + ' ' + operations.map((v) => v.name).join(' '));
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            linkAurumDevtoolsNodes(
                this,
                result,
                { kind: 'transform', label: operations.map((operation) => operation.name).join(' → '), metadata: { operators: operations.map((operation) => operation.name) } },
                token
            );
        }
        (this.primed ? this.listenAndRepeat : this.listen).call(this, processTransform<T, any>(operations, result, token), token);
        this.onError((e) => result.emitError(e), token);

        return result;
    }

    public static fromAggregation<R, A>(sources: [ReadOnlyDataSource<A>], combinator: (first: A) => R, cancellationToken?: CancellationToken): DataSource<R>;
    public static fromAggregation<R, A, B>(
        sources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>],
        combinator: (first: A, second: B) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R, A, B, C>(
        sources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>],
        combinator: (first: A, second: B, third: C) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R, A, B, C, D>(
        sources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>],
        combinator: (first: A, second: B, third: C, fourth: D) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R, A, B, C, D, E>(
        sources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>, ReadOnlyDataSource<E>],
        combinator: (first: A, second: B, third: C, fourth: D, fifth: E) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R, A, B, C, D, E, F>(
        sources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>, ReadOnlyDataSource<E>, ReadOnlyDataSource<F>],
        combinator: (first: A, second: B, third: C, fourth: D, fifth: E, sixth: F) => R,
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
        combinator: (first: A, second: B, third: C, fourth: D, fifth: E, sixth: F, seventh: G) => R,
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
        combinator: (first: A, second: B, third: C, fourth: D, fifth: E, sixth: F, seventh: G, eigth: H) => R,
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
        combinator: (first: A, second: B, third: C, fourth: D, fifth: E, sixth: F, seventh: G, eigth: H, ninth: I) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public static fromAggregation<R>(
        sources: ReadOnlyDataSource<any>[],
        combinator: (...data: any[]) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R> {
        cancellationToken = cancellationToken ?? new CancellationToken();

        const aggregatedSource = new DataSource<R>(combinator(...sources.map((s) => s?.value)));
        for (const source of sources) {
            if (source) linkAurumDevtoolsNodes(source as object, aggregatedSource, { kind: 'aggregate' }, cancellationToken);
        }

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
        combinator: (self: T, second: A, third: B) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public aggregate<R, A, B, C>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>],
        combinator: (self: T, second: A, third: B, fourth: C) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public aggregate<R, A, B, C, D>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>],
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public aggregate<R, A, B, C, D, E>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>, ReadOnlyDataSource<E>],
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E) => R,
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
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F) => R,
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
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G) => R,
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
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H) => R,
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
        combinator: (self: T, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H, tenth: I) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public aggregate<R>(otherSources: ReadOnlyDataSource<any>[], combinator: (...data: any[]) => R, cancellationToken?: CancellationToken): DataSource<R> {
        cancellationToken = cancellationToken ?? new CancellationToken();

        const aggregatedSource = new DataSource<R>(combinator(this.value, ...otherSources.map((s) => s?.value)));
        linkAurumDevtoolsNodes(this, aggregatedSource, { kind: 'aggregate', label: 'self' }, cancellationToken);
        for (const source of otherSources) {
            if (source) linkAurumDevtoolsNodes(source as object, aggregatedSource, { kind: 'aggregate' }, cancellationToken);
        }

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
        linkAurumDevtoolsNodes(this, targetDataSource, { kind: 'pipe' }, cancellationToken);
        (this.primed ? this.listenAndRepeat : this.listen).call(this, (v: T) => targetDataSource.update(v), cancellationToken);

        return this;
    }

    public static fromCombination<T>(sources: ReadOnlyDataSource<T>[], cancellationToken?: CancellationToken): DataSource<T> {
        if (sources.length === 0) {
            throw new Error('Cannot combine zero data sources');
        }

        return sources[0].combine(sources.slice(1), cancellationToken);
    }
    /**
     * Like aggregate except that it aggregates an array data source of datasources
     * @param data Second parent for the new source
     * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
     */
    public static fromDynamicAggregation<I, O>(
        data: ReadOnlyArrayDataSource<ReadOnlyDataSource<I>>,
        aggregate: (items: readonly I[]) => O,
        cancellationToken?: CancellationToken
    ): DataSource<O> {
        cancellationToken = cancellationToken ?? new CancellationToken();
        const session = new WeakMap<ReadOnlyDataSource<I>, { token: CancellationToken; references: number }>();

        const result = new DataSource<O>();
        linkAurumDevtoolsNodes(data as object, result, { kind: 'dynamic-aggregate' }, cancellationToken);
        data.onItemsAdded.subscribe((items) => {
            for (const item of items) {
                listenToSubSource(item);
            }
            result.update(aggregate(data.getData().map((e) => e.value)));
        }, cancellationToken);

        data.onItemsRemoved.subscribe((items) => {
            for (const item of items) {
                const itemSession = session.get(item);
                if (itemSession) {
                    itemSession.references--;
                    if (itemSession.references === 0) {
                        itemSession.token.cancel();
                        session.delete(item);
                    }
                }
            }
            result.update(aggregate(data.getData().map((e) => e.value)));
        }, cancellationToken);

        for (const item of data) {
            listenToSubSource(item);
        }
        result.update(aggregate(data.getData().map((item) => item.value)));

        return result;

        function listenToSubSource(item: ReadOnlyDataSource<I>) {
            const existingSession = session.get(item);
            if (existingSession) {
                existingSession.references++;
                return;
            }

            const itemToken = new CancellationToken();
            session.set(item, { token: itemToken, references: 1 });
            cancellationToken.addCancellable(itemToken);
            linkAurumDevtoolsNodes(item as object, result, { kind: 'dynamic-aggregate-item' }, itemToken);
            item.listen(() => {
                result.update(aggregate(data.getData().map((e) => e.value)));
            }, itemToken);
        }
    }

    /**
     * Like aggregate except that no combination method is needed as a result both parents must have the same type and the new stream just exposes the last update recieved from either parent
     * @param otherSource Second parent for the new source
     * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
     */
    public combine(otherSources: ReadOnlyDataSource<T>[], cancellationToken?: CancellationToken): DataSource<T> {
        cancellationToken = cancellationToken ?? new CancellationToken();

        let combinedDataSource: DataSource<T>;
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
        return new Promise((resolve, reject) => {
            cancellationToken?.addCancellable(() => reject(new Error('Cancelled')));
            this.listenOnce((value) => resolve(value), cancellationToken);
        });
    }

    /**
     * Resolves with the current value when it matches, or waits for the next matching update.
     * Without a predicate, null and undefined values are skipped.
     */
    public awaitValue(cancellationToken?: CancellationToken): Promise<NonNullable<T>>;
    public awaitValue(predicate: undefined, cancellationToken?: CancellationToken): Promise<NonNullable<T>>;
    public awaitValue<S extends T>(predicate: (value: T) => value is S, cancellationToken?: CancellationToken): Promise<S>;
    public awaitValue(predicate: (value: T) => boolean, cancellationToken?: CancellationToken): Promise<T>;
    public awaitValue<S extends T>(
        predicateOrToken?: ((value: T) => boolean) | CancellationToken,
        cancellationToken?: CancellationToken
    ): Promise<T | S> {
        const predicate =
            typeof predicateOrToken === 'function'
                ? predicateOrToken
                : (value: T): boolean => value !== null && value !== undefined;
        const token = predicateOrToken instanceof CancellationToken ? predicateOrToken : cancellationToken;

        if (token?.isCancelled) return Promise.reject(new Error('Cancelled'));
        try {
            if (this.primed && predicate(this.value)) return Promise.resolve(this.value);
        } catch (error) {
            return Promise.reject(error);
        }

        return new Promise<T | S>((resolve, reject) => {
            const subscriptionToken = new CancellationToken();
            const cancelWait = (): void => {
                subscriptionToken.cancel();
                reject(new Error('Cancelled'));
            };
            token?.addCancellable(cancelWait);

            const cleanUp = (): void => {
                subscriptionToken.cancel();
                if (token && !token.isCancelled) token.removeCancellable(cancelWait);
            };

            this.listen((value) => {
                try {
                    if (!predicate(value)) return;
                    cleanUp();
                    resolve(value);
                } catch (error) {
                    cleanUp();
                    reject(error);
                }
            }, subscriptionToken);
        });
    }

    /**
     * Returns an async iterator that will yield the next N values of the data source
     */
    public take(amount: number, cancellationToken?: CancellationToken): AsyncIterableIterator<T> {
        if (cancellationToken?.isCancelled) {
            return {
                [Symbol.asyncIterator](): AsyncIterableIterator<T> {
                    return this;
                },
                next: async () => ({ done: true, value: undefined })
            };
        }
        let taken = 0;
        const done = new CancellationToken();
        const iterator = this.toAsyncIterator(done.or(cancellationToken));

        return {
            [Symbol.asyncIterator](): AsyncIterableIterator<T> {
                return this;
            },
            next: async () => {
                if (taken >= amount) {
                    done.cancel();
                    return { done: true, value: undefined };
                }
                taken++;
                return iterator.next();
            }
        };
    }

    /**
     * Remove all listeners
     */
    public cancelAll(): void {
        this.updateEvent.cancelAll();
    }
}

type DetailedOperations = 'replace' | 'append' | 'prepend' | 'removeRight' | 'removeLeft' | 'remove' | 'swap' | 'clear' | 'merge' | 'insert';

declare const collectionItemIdentityBrand: unique symbol;

/**
 * Opaque identity assigned to an occurrence in an ArrayDataSource. Identities
 * are managed by the source and are intentionally not supplied by users.
 */
export interface CollectionItemIdentity {
    readonly [collectionItemIdentityBrand]: true;
}

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
    /** @internal Identities corresponding to `items`. */
    readonly itemIdentities?: readonly CollectionItemIdentity[];
    /** @internal Identity of `target` for replace operations. */
    readonly targetIdentity?: CollectionItemIdentity;
    /** @internal Identities corresponding to `newState`. */
    readonly newStateIdentities?: readonly CollectionItemIdentity[];
    /** @internal Identities corresponding to `previousState`. */
    readonly previousStateIdentities?: readonly CollectionItemIdentity[];
}

export interface ReadOnlyArrayDataSourceView<T> extends ReadOnlyArrayDataSource<T> {
    refresh(): void;
}

export interface ReadOnlyArrayDataSource<T> {
    [Symbol.iterator](): IterableIterator<T>;
    onItemsAdded: EventEmitter<T[]>;
    onItemsRemoved: EventEmitter<T[]>;
    listenAndRepeat(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): void;
    listen(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): void;
    listenOnce(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): void;
    awaitNextUpdate(cancellationToken?: CancellationToken): Promise<CollectionChange<T>>;
    length: ReadOnlyDataSource<number>;
    getData(): ReadonlyArray<T>;
    /** @internal Used by renderers and derived sources to preserve occurrence identity. */
    getItemIdentities(): readonly CollectionItemIdentity[];
    get(index: number): T;
    pickAt(index: number, cancellationToken?: CancellationToken): ReadOnlyDataSource<T>;
    limit(count: number, cancellationToken?: CancellationToken): ReadOnlyArrayDataSource<T>;
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

export interface FetchStreamConfig {
    onComplete?: () => void;
    itemSeperatorSequence: string;
}

export class ArrayDataSource<T> implements ReadOnlyArrayDataSource<T> {
    protected data: T[];
    protected itemIdentities: CollectionItemIdentity[];
    private nextIdentityHint?: readonly CollectionItemIdentity[];
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
        this.itemIdentities = this.data.map(() => createCollectionItemIdentity());
        this.lengthSource = new DataSource(this.data.length, this.name + '.length');
        this.updateEvent = new EventEmitter();
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            registerAurumDevtoolsNode(this, {
                kind: 'array-data-source',
                name,
                getValue: (target) => target.getData()
            });
        }
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            this.updateEvent.observeSubscriptionCount((count) => setAurumDevtoolsSubscriptionCount(this, count), false);
            this.onItemsAdded.observeSubscriptionCount((count) => setAurumDevtoolsSubscriptionCount(this, count, 'items-added'), false);
            this.onItemsRemoved.observeSubscriptionCount((count) => setAurumDevtoolsSubscriptionCount(this, count, 'items-removed'), false);
        }
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            linkAurumDevtoolsNodes(this, this.lengthSource, { kind: 'derived', label: 'length' });
        }
    }

    *[Symbol.iterator](): IterableIterator<T> {
        yield* this.getData();
        return;
    }

    /**
     * Returns a datasource that always contains the item that is currently at the specified index
     * @param index
     * @param cancellationToken
     * @returns
     */
    public pickAt(index: number, cancellationToken?: CancellationToken): ReadOnlyDataSource<T> {
        if (index < 0) {
            throw new Error('Index out of bounds');
        }

        const result = new DataSource<T>(this.data[index], this.name + `[${index}]`);
        linkAurumDevtoolsNodes(this, result, { kind: 'derived', label: `index ${index}` }, cancellationToken);
        this.listen((change) => {
            if (result.value !== change.newState[index]) {
                result.update(change.newState[index]);
            }
        }, cancellationToken);

        return result;
    }

    public toSetDataSource(cancellationToken: CancellationToken): ReadOnlySetDataSource<T> {
        const result = new SetDataSource<T>();
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'toSetDataSource' }, cancellationToken);

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

    public static fromFetchText(response: Response, config: FetchStreamConfig = { itemSeperatorSequence: '\n' }): ArrayDataSource<string> {
        const iterator = readableStreamStringIterator(response.body.getReader(), config.itemSeperatorSequence, config.onComplete);

        const result = new ArrayDataSource<string>();

        (async () => {
            for await (const item of iterator) {
                result.push(item);
            }
        })();

        return result;
    }

    public static fromFetchJSON<T>(
        response: Response,
        config: FetchStreamConfig & {
            onParseError?: (error: Error, item: string) => T;
        } = {
            itemSeperatorSequence: '\n'
        }
    ): ArrayDataSource<T> {
        const iterator = readableStreamStringIterator(response.body.getReader(), config.itemSeperatorSequence, config.onComplete);

        const result = new ArrayDataSource<T>();

        (async () => {
            for await (const item of iterator) {
                try {
                    result.push(JSON.parse(item));
                } catch (e) {
                    if (config.onParseError) {
                        result.push(config.onParseError(e, item));
                    } else {
                        throw e;
                    }
                }
            }
        })();

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

        // FromMultipleSources can create severe performance penalties on some operations so if we can avoid the complexity we should
        // In these 2 cases we can avoid the complexity by returning a regular ArrayDataSource
        if (Array.isArray(sources) && sources.length === 1) {
            if (sources[0] instanceof ArrayDataSource) {
                return sources[0] as ArrayDataSource<T>;
            } else if (!(sources[0] instanceof DataSource)) {
                return new ArrayDataSource<T>(sources[0] as T[]);
            }
        }

        for (let i = 0; i < sources.length; i++) {
            const item = sources[i];
            if (Array.isArray(item)) {
                result.appendArray(item as T[]);
            } else if (item instanceof DataSource) {
                linkAurumDevtoolsNodes(item, result, { kind: 'combine', label: `source ${i}` }, cancellationToken);
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
                linkAurumDevtoolsNodes(item as object, result, { kind: 'combine', label: `source ${i}` }, cancellationToken);
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
                            const lengthDiff = change.newState.length - change.previousState.length;
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
            | ReadOnlyArrayDataSource<GenericDataSource<T>>,
        cancellation: CancellationToken
    ): ReadOnlyArrayDataSource<T> {
        const result = new ArrayDataSource<T>();
        linkAurumDevtoolsNodes(arrayDataSource as object, result, { kind: 'transform', label: 'unwrap sources' }, cancellation);
        const session = new WeakMap<any, { token: CancellationToken; references: number }>();
        arrayDataSource.listenAndRepeat((change: CollectionChange<any>) => {
            const { operationDetailed, index, index2, count, items, previousState, newState, target } = change;
            switch (operationDetailed) {
                case 'append':
                    for (const item of items) {
                        listenToItem(item);
                    }
                    result.appendArray(items.map((item) => getSourceValue(item)));
                    break;
                case 'prepend':
                    for (const item of items) {
                        listenToItem(item);
                    }
                    result.unshift(...items.map((item) => getSourceValue(item)));
                    break;
                case 'merge':
                    for (const item of previousState) {
                        stopLitenToItem(item);
                    }
                    for (const item of newState) {
                        listenToItem(item);
                    }
                    result.merge(newState.map((i) => getSourceValue(i)));
                    break;
                case 'insert':
                    for (const item of items) {
                        listenToItem(item);
                    }
                    result.insertAt(index, ...items.map((item) => getSourceValue(item)));
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
                    result.set(index, getSourceValue(items[0]));
                    break;
                case 'swap':
                    result.swap(index, index2);
                    break;
            }
        }, cancellation);
        return result;

        function listenToItem(item: ReadOnlyDataSource<T> | T | DataSource<T> | GenericDataSource<T>) {
            if (item === null || typeof item !== 'object' || !('listen' in item)) {
                return;
            }

            const existingSession = session.get(item);
            if (existingSession) {
                existingSession.references++;
                return;
            }

            const itemToken = new CancellationToken();
            session.set(item, { token: itemToken, references: 1 });
            cancellation.addCancellable(itemToken);
            linkAurumDevtoolsNodes(item, result, { kind: 'dynamic-item' }, itemToken);
            item.listen((value) => {
                const sourceData = arrayDataSource.getData();
                for (let index = 0; index < sourceData.length; index++) {
                    if (sourceData[index] === item) {
                        result.set(index, value);
                    }
                }
            }, itemToken);
        }

        function stopLitenToItem(item: ReadOnlyDataSource<T> | T) {
            const itemSession = session.get(item);
            if (itemSession) {
                itemSession.references--;
                if (itemSession.references > 0) {
                    return;
                }
                itemSession.token.cancel();
                session.delete(item);
            }
        }

        function getSourceValue(item: ReadOnlyDataSource<T> | T): T {
            return typeof item === 'object' && item !== null && 'value' in item ? item.value : (item as T);
        }
    }

    public static fromAsyncIterator<T>(iterator: AsyncIterableIterator<T>, cancellation?: CancellationToken): ArrayDataSource<T> {
        const result = new ArrayDataSource<T>();

        (async () => {
            for await (const item of iterator) {
                if (cancellation?.isCancelled) {
                    return;
                }
                result.push(item);
            }
        })();

        return result;
    }

    public static fromPromiseArray<T>(promises: Promise<T>[], cancellation?: CancellationToken): ArrayDataSource<PromiseSettledResult<T>> {
        const result = new ArrayDataSource<PromiseSettledResult<T>>();

        (async () => {
            for await (const promise of promiseIterator(promises, cancellation)) {
                if (cancellation?.isCancelled) {
                    return;
                }
                result.push(promise);
            }
        })();

        return result;
    }

    public toAsyncIterator(cancellation?: CancellationToken): AsyncIterableIterator<CollectionChange<T>> {
        return this.updateEvent.toAsyncIterator(undefined, cancellation);
    }

    public static toArrayDataSource<T>(value: T[] | ArrayDataSource<T>): ArrayDataSource<T> {
        if (value instanceof ArrayDataSource) {
            return value;
        } else {
            return new ArrayDataSource(value);
        }
    }

    public pipe(target: ArrayDataSource<T>, cancellation?: CancellationToken): void {
        linkAurumDevtoolsNodes(this, target, { kind: 'pipe' }, cancellation);
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
    public listenAndRepeat(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): void {
        if (this.data.length) {
            const change: CollectionChange<T> = {
                operation: 'add',
                operationDetailed: 'append',
                index: 0,
                items: this.data,
                newState: this.data,
                count: this.data.length
            };
            attachCollectionIdentities(change, this.itemIdentities, undefined, this.itemIdentities, undefined);
            callback(change);
        }
        this.listen(callback, cancellationToken);
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

    public listen(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): void {
        this.updateEvent.subscribe(callback, cancellationToken);
    }

    public listenOnce(callback: Callback<CollectionChange<T>>, cancellationToken?: CancellationToken): void {
        this.updateEvent.subscribeOnce(callback, cancellationToken);
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

    public getItemIdentities(): readonly CollectionItemIdentity[] {
        return this.itemIdentities;
    }

    /** @internal Allows derived sources to retain parent occurrence identity. */
    protected inheritNextIdentities(identities: readonly CollectionItemIdentity[] | undefined): void {
        this.nextIdentityHint = identities;
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
            this.nextIdentityHint = undefined;
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
        let removed: T[] = [];
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
            this.nextIdentityHint = undefined;
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
            this.clear();
            return;
        }
        const identityChanged =
            this.nextIdentityHint !== undefined &&
            (this.nextIdentityHint.length !== this.itemIdentities.length ||
                this.nextIdentityHint.some((identity, index) => identity !== this.itemIdentities[index]));
        if (newData === this.data && !identityChanged) {
            this.nextIdentityHint = undefined;
            return;
        }

        if (!identityChanged && newData.every((v, i) => v === this.data[i])) {
            if (this.data.length > newData.length) {
                this.nextIdentityHint = undefined;
                this.removeRight(this.data.length - newData.length);
                return;
            } else {
                this.nextIdentityHint = undefined;
                return;
            }
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
        // Optimization since clear is often a single operation vs removing items one by one
        if (count >= this.data.length) {
            return this.clear();
        }
        const length = this.data.length;
        const result = this.data.splice(length - count, count);
        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }
        this.update({ operation: 'remove', operationDetailed: 'removeRight', count, index: length - count, items: result, newState: this.data });
        this.onItemsRemoved.fire(result);

        return result;
    }

    public removeLeft(count: number): T[] {
        // Optimization since clear is often a single operation vs removing items one by one
        if (count >= this.data.length) {
            return this.clear();
        }

        const removed = this.data.splice(0, count);
        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }
        this.update({ operation: 'remove', operationDetailed: 'removeLeft', count, index: 0, items: removed, newState: this.data });
        this.onItemsRemoved.fire(removed);

        return removed;
    }

    public removeWhere(reject: (v: T) => boolean): T[] {
        const removed = this.data.filter(reject);

        if (removed.length === this.data.length) {
            return this.clear();
        }

        for (const item of removed) {
            this.remove(item);
        }

        return removed;
    }

    public removeAt(index: number, count: number = 1): T[] {
        if (index === 0 && count === this.data.length) {
            return this.clear();
        }

        const removed = this.data.splice(index, count);
        this.update({ operation: 'remove', operationDetailed: 'remove', count: removed.length, index, items: removed, newState: this.data });
        this.onItemsRemoved.fire(removed);
        if (this.lengthSource.value !== this.data.length) {
            this.lengthSource.update(this.data.length);
        }

        return removed;
    }

    public removeRange(start: number, end: number): T[] {
        return this.removeAt(start, end - start);
    }

    public remove(item: T): T {
        const index = this.data.indexOf(item);
        if (index !== -1) {
            return this.removeAt(index)[0];
        } else {
            return undefined;
        }
    }

    public clear(): T[] {
        if (this.data.length === 0) {
            return [];
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

        return items;
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
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: 'flat' }, cancellationToken);

        return view as any;
    }

    public reduce<R>(reducer: (acc: R, value: T) => R, initial?: R, cancellationToken?: CancellationToken): DataSource<R> {
        const result = new DataSource<R>(initial);
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'reduce' }, cancellationToken);

        this.listenAndRepeat((change: CollectionChange<T>) => {
            switch (change.operationDetailed) {
                case 'append':
                    let newVal = result.value;
                    for (const item of change.items) {
                        newVal = reducer(newVal, item);
                    }
                    result.update(newVal);
                    break;
                case 'clear':
                    result.update(initial);
                    break;
                case 'removeRight':
                case 'removeLeft':
                case 'prepend':
                case 'insert':
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

    public reverse(cancellationToken?: CancellationToken, config?: ViewConfig): ReadOnlyArrayDataSourceView<T> {
        const view = new ReversedArrayView<T>(this, cancellationToken, this.name + '.reverse()', config);
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: 'reverse' }, cancellationToken);

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
    ): ReadOnlyArrayDataSourceView<T> {
        const view = new SortedArrayView(this, comparator, cancellationToken, this.name + '.sort()', config);
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: 'sort' }, cancellationToken);

        dependencies.forEach((dep) => {
            linkAurumDevtoolsNodes(dep as object, view, { kind: 'dependency', label: 'sort dependency' }, cancellationToken);
            dep.listen(() => view.refresh(), cancellationToken);
        });

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

        const view = new SlicedArrayView(this, start, end, cancellationToken, this.name + '.slice()', config);
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: 'slice' }, cancellationToken);
        linkAurumDevtoolsNodes(start, view, { kind: 'dependency', label: 'slice start' }, cancellationToken);
        linkAurumDevtoolsNodes(end, view, { kind: 'dependency', label: 'slice end' }, cancellationToken);
        return view;
    }

    public map<D>(
        mapper: (data: T) => D,
        dependencies: ReadOnlyDataSource<any>[] = [],
        cancellationToken?: CancellationToken,
        config?: ViewConfig
    ): ReadOnlyArrayDataSource<D> {
        const view = new MappedArrayView<T, D>(this, mapper, cancellationToken, this.name + '.map()', config);
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: 'map' }, cancellationToken);

        dependencies.forEach((dep) => {
            linkAurumDevtoolsNodes(dep as object, view, { kind: 'dependency', label: 'map dependency' }, cancellationToken);
            dep.listen(() => view.refresh(), cancellationToken);
        });

        return view;
    }

    public unique(cancellationToken?: CancellationToken, config?: ViewConfig): ReadOnlyArrayDataSource<T> {
        const view = new UniqueArrayView(this, cancellationToken, this.name + '.unique()', config);
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: 'unique' }, cancellationToken);
        return view;
    }

    public indexBy<K extends keyof T>(key: K, cancellationToken?: CancellationToken, config?: ViewConfig): MapDataSource<T[K], T> {
        const view = new MapDataSource<T[K], T>();
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: `indexBy(${String(key)})` }, cancellationToken);

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
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: 'indexByProvider' }, cancellationToken);

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
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: `groupBy(${String(key)})` }, cancellationToken);

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
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: 'groupByProvider' }, cancellationToken);

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
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: 'groupByMultiProvider' }, cancellationToken);

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
    ): ReadOnlyArrayDataSourceView<T> {
        const view = new FilteredArrayView(this, callback, cancellationToken, this.name + '.filter()', config);
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: 'filter' }, cancellationToken);

        dependencies.forEach((dep) => {
            linkAurumDevtoolsNodes(dep as object, view, { kind: 'dependency', label: 'filter dependency' }, cancellationToken);
            dep.listen(() => view.refresh(), cancellationToken);
        });

        return view;
    }

    public limit(count: number, cancellationToken?: CancellationToken): ReadOnlyArrayDataSource<T> {
        const view = new LimitedArrayView(this, count, cancellationToken, this.name + '.limit()');
        linkAurumDevtoolsNodes(this, view, { kind: 'transform', label: 'limit' }, cancellationToken);

        return view;
    }

    public forEach(callbackfn: (value: T, index: number, array: T[]) => void): void {
        return this.data.forEach(callbackfn);
    }

    protected update(change: CollectionChange<T>) {
        const identityHint = this.nextIdentityHint;
        this.nextIdentityHint = undefined;
        let changedIdentities: CollectionItemIdentity[];
        let previousIdentities: CollectionItemIdentity[];
        let targetIdentity: CollectionItemIdentity;
        switch (change.operationDetailed) {
            case 'append':
            case 'prepend':
            case 'insert':
                changedIdentities =
                    identityHint?.length === change.items.length
                        ? identityHint.slice()
                        : change.items.map(() => createCollectionItemIdentity());
                this.itemIdentities.splice(change.index, 0, ...changedIdentities);
                break;
            case 'remove':
            case 'removeLeft':
            case 'removeRight':
            case 'clear':
                changedIdentities = this.itemIdentities.splice(change.index, change.count ?? change.items.length);
                break;
            case 'replace':
                targetIdentity = this.itemIdentities[change.index];
                changedIdentities = identityHint?.length === 1 ? identityHint.slice() : [createCollectionItemIdentity()];
                this.itemIdentities.splice(change.index, 1, changedIdentities[0]);
                break;
            case 'swap': {
                const firstIdentity = this.itemIdentities[change.index];
                const secondIdentity = this.itemIdentities[change.index2];
                this.itemIdentities[change.index] = secondIdentity;
                this.itemIdentities[change.index2] = firstIdentity;
                changedIdentities = [firstIdentity, secondIdentity];
                break;
            }
            case 'merge':
                previousIdentities = this.itemIdentities.slice();
                this.itemIdentities =
                    identityHint?.length === change.newState.length
                        ? identityHint.slice()
                        : reconcileCollectionIdentities(change.previousState ?? [], previousIdentities, change.newState);
                changedIdentities = this.itemIdentities;
                break;
        }
        attachCollectionIdentities(change, changedIdentities, targetIdentity, this.itemIdentities, previousIdentities);
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            emitAurumDevtoolsUpdate(this, {
                kind: change.operationDetailed,
                value: this.data,
                details: { operation: change.operation, index: change.index, index2: change.index2, count: change.count }
            });
        }
        this.updateEvent.fire(change);
    }
}

function createCollectionItemIdentity(): CollectionItemIdentity {
    return {} as CollectionItemIdentity;
}

function reconcileCollectionIdentities<T>(
    previousState: readonly T[],
    previousIdentities: readonly CollectionItemIdentity[],
    newState: readonly T[]
): CollectionItemIdentity[] {
    const identitiesByValue = new Map<T, CollectionItemIdentity[]>();
    for (let index = 0; index < previousState.length; index++) {
        const identities = identitiesByValue.get(previousState[index]);
        if (identities) identities.push(previousIdentities[index]);
        else identitiesByValue.set(previousState[index], [previousIdentities[index]]);
    }
    const offsets = new Map<T, number>();
    return newState.map((item) => {
        const identities = identitiesByValue.get(item);
        const offset = offsets.get(item) ?? 0;
        if (identities && offset < identities.length) {
            offsets.set(item, offset + 1);
            return identities[offset];
        }
        return createCollectionItemIdentity();
    });
}

function attachCollectionIdentities<T>(
    change: CollectionChange<T>,
    itemIdentities: readonly CollectionItemIdentity[] | undefined,
    targetIdentity: CollectionItemIdentity | undefined,
    newStateIdentities: readonly CollectionItemIdentity[],
    previousStateIdentities: readonly CollectionItemIdentity[] | undefined
): void {
    // Keep renderer metadata out of JSON payloads used by remote sources.
    Object.defineProperties(change, {
        itemIdentities: { value: itemIdentities, enumerable: false },
        targetIdentity: { value: targetIdentity, enumerable: false },
        newStateIdentities: { value: newStateIdentities, enumerable: false },
        previousStateIdentities: { value: previousStateIdentities, enumerable: false }
    });
}

export interface ViewConfig {
    ignoredOperations?: DetailedOperations[];
}

export class FlattenedArrayView<T> extends ArrayDataSource<T> {
    private parent: ArrayDataSource<T[]>;
    private depth: number;
    private sessionToken: CancellationToken;
    private derivedIdentities = new Map<CollectionItemIdentity, CollectionItemIdentity[]>();

    constructor(
        parent: ArrayDataSource<T[]>,
        depth: number,
        cancellationToken: CancellationToken = new CancellationToken(),
        name?: string,
        config?: ViewConfig
    ) {
        super([], name);
        updateAurumDevtoolsNode(this, { kind: 'array-view', metadata: { transformation: 'flat', depth } });
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
                    this.inheritNextIdentities(
                        change.operationDetailed === 'merge' ? change.newStateIdentities : change.itemIdentities
                    );
                    this.applyCollectionChange(change);
                }, this.sessionToken);
                this.inheritNextIdentities(combination.getItemIdentities());
                this.merge(combination.getData() as any);
            } else {
                const flattened: T[] = [];
                const identities: CollectionItemIdentity[] = [];
                const parentIdentities = this.parent.getItemIdentities();
                const retainedParents = new Set(parentIdentities);
                for (let index = 0; index < data.length; index++) {
                    const values = Array.isArray(data[index])
                        ? (data[index].flat(Math.max(0, this.depth - 1)) as T[])
                        : ([data[index]] as T[]);
                    let childIdentities = this.derivedIdentities.get(parentIdentities[index]);
                    if (!childIdentities) {
                        childIdentities = [];
                        this.derivedIdentities.set(parentIdentities[index], childIdentities);
                    }
                    while (childIdentities.length < values.length) childIdentities.push(createCollectionItemIdentity());
                    childIdentities.length = values.length;
                    flattened.push(...values);
                    identities.push(...childIdentities);
                }
                for (const identity of this.derivedIdentities.keys()) {
                    if (!retainedParents.has(identity)) this.derivedIdentities.delete(identity);
                }
                this.inheritNextIdentities(identities);
                this.merge(flattened);
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
        updateAurumDevtoolsNode(this, { kind: 'array-view', metadata: { transformation: 'map' } });
        this.parent = parent;
        this.mapper = mapper;
        this.itemIdentities = parent.getItemIdentities().slice();

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
                    this.removeAt(change.index, change.count);
                    break;
                case 'clear':
                    this.clear();
                    break;
                case 'prepend':
                    this.inheritNextIdentities(change.itemIdentities);
                    this.unshift(...change.items.map(this.mapper));
                    break;
                case 'append':
                    this.inheritNextIdentities(change.itemIdentities);
                    this.appendArray(change.items.map(this.mapper));
                    break;
                case 'insert':
                    this.inheritNextIdentities(change.itemIdentities);
                    this.insertAt(change.index, ...change.items.map(this.mapper));
                    break;
                case 'swap':
                    this.swap(change.index, change.index2);
                    break;
                case 'replace':
                    this.inheritNextIdentities(change.itemIdentities);
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
                                this.data.splice(i, 0, this.mapper(change.newState[i]));
                                source.splice(i, 0, change.newState[i]);
                            }
                        }
                    }
                    if (this.data.length > change.newState.length) {
                        this.data.length = change.newState.length;
                    }
                    this.length.update(this.data.length);
                    this.inheritNextIdentities(change.newStateIdentities);
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
        this.inheritNextIdentities(this.parent.getItemIdentities());
        this.merge(this.parent.getData().map(this.mapper));
    }
}

export class ReversedArrayView<T> extends ArrayDataSource<T> {
    private parent: ArrayDataSource<T>;

    constructor(parent: ArrayDataSource<T>, cancellationToken: CancellationToken = new CancellationToken(), name?: string, config?: ViewConfig) {
        const initial = parent.getData().slice().reverse();
        super(initial, name);
        updateAurumDevtoolsNode(this, { kind: 'array-view', metadata: { transformation: 'reverse' } });
        this.parent = parent;
        this.itemIdentities = parent.getItemIdentities().slice().reverse();

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
                    this.removeAt(change.newState.length - change.index, change.count);
                    break;
                case 'clear':
                    this.clear();
                    break;
                case 'prepend':
                    this.inheritNextIdentities(change.itemIdentities?.slice().reverse());
                    this.appendArray(change.items.slice().reverse());
                    break;
                case 'append':
                    this.inheritNextIdentities(change.itemIdentities?.slice().reverse());
                    this.unshift(...change.items.slice().reverse());
                    break;
                case 'insert':
                    this.inheritNextIdentities(change.newStateIdentities?.slice().reverse());
                    this.merge(change.newState.slice().reverse());
                    break;
                case 'merge':
                    this.inheritNextIdentities(change.newStateIdentities?.slice().reverse());
                    this.merge(change.items.slice().reverse());
                    break;
                case 'swap':
                    this.inheritNextIdentities(change.newStateIdentities?.slice().reverse());
                    this.merge(change.newState.slice().reverse());
                    break;
                case 'replace':
                    this.inheritNextIdentities(change.newStateIdentities?.slice().reverse());
                    this.merge(change.newState.slice().reverse());
                    break;
            }
        }, cancellationToken);
    }

    public refresh() {
        this.inheritNextIdentities(this.parent.getItemIdentities().slice().reverse());
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
        updateAurumDevtoolsNode(this, { kind: 'array-view', metadata: { transformation: 'slice' } });
        this.itemIdentities = parent.getItemIdentities().slice(start.value, end.value);

        const synchronize = () => {
            this.inheritNextIdentities(parent.getItemIdentities().slice(start.value, end.value));
            this.merge(parent.getData().slice(start.value, end.value));
        };

        start.listen(synchronize, cancellationToken);
        end.listen(synchronize, cancellationToken);

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
                    synchronize();
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
        updateAurumDevtoolsNode(this, { kind: 'array-view', metadata: { transformation: 'unique' } });
        let filteredItems: T[];
        const synchronizeIdentities = () => {
            const parentIdentities = parent.getItemIdentities();
            const identities = this.data.map((value) => {
                const index = parent.getData().findIndex((item) => item === value || Object.is(item, value));
                return parentIdentities[index];
            });
            this.inheritNextIdentities(identities);
            this.merge(this.data.slice());
        };
        synchronizeIdentities();

        parent.listen((change) => {
            if (config?.ignoredOperations?.includes(change.operationDetailed)) {
                return;
            }

            switch (change.operationDetailed) {
                case 'removeLeft':
                case 'removeRight':
                case 'remove':
                    for (const item of change.items) {
                        if (!change.newState.includes(item)) this.remove(item);
                    }
                    break;
                case 'clear':
                    this.clear();
                    return;
                case 'prepend':
                    filteredItems = change.items.filter((item, index) => change.items.indexOf(item) === index && !this.data.includes(item));
                    if (filteredItems.length > 0) this.unshift(...filteredItems);
                    break;
                case 'append':
                    filteredItems = change.items.filter((item) => !this.data.includes(item));
                    if (filteredItems.length > 0) this.appendArray(filteredItems);
                    break;
                case 'insert':
                    filteredItems = change.items.filter((item, index) => change.items.indexOf(item) === index && !this.data.includes(item));
                    if (filteredItems.length > 0) this.insertAt(Math.min(change.index, this.data.length), ...filteredItems);
                    break;
                case 'merge':
                    this.merge(Array.from(new Set(parent.getData())));
                    break;
                case 'swap':
                    break;
                case 'replace': {
                    const targetStillExists = parent.includes(change.target);
                    const replacementExists = this.data.includes(change.items[0]);
                    if (!targetStillExists) {
                        const targetIndex = this.indexOf(change.target);
                        if (replacementExists) this.removeAt(targetIndex);
                        else this.set(targetIndex, change.items[0]);
                    } else if (!replacementExists) {
                        this.insertAt(Math.min(change.index, this.data.length), change.items[0]);
                    }
                    break;
                }
            }
            synchronizeIdentities();
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
        updateAurumDevtoolsNode(this, { kind: 'array-view', metadata: { transformation: 'sort' } });
        this.parent = parent;
        this.comparator = comparator;
        const synchronize = () => {
            const pairs = parent
                .getData()
                .map((value, index) => ({ value, identity: parent.getItemIdentities()[index] }))
                .sort((left, right) => this.comparator(left.value, right.value));
            this.inheritNextIdentities(pairs.map((pair) => pair.identity));
            this.merge(pairs.map((pair) => pair.value));
        };
        synchronize();

        parent.listen((change) => {
            if (config?.ignoredOperations?.includes(change.operationDetailed)) {
                return;
            }

            if (change.operationDetailed === 'clear') this.clear();
            else synchronize();
        }, cancellationToken);
    }

    public refresh() {
        const pairs = this.parent
            .getData()
            .map((value, index) => ({ value, identity: this.parent.getItemIdentities()[index] }))
            .sort((left, right) => this.comparator(left.value, right.value));
        this.inheritNextIdentities(pairs.map((pair) => pair.identity));
        this.merge(pairs.map((pair) => pair.value));
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
        updateAurumDevtoolsNode(this, { kind: 'array-view', metadata: { transformation: 'filter' } });

        this.parent = parent;
        this.viewFilter = filter;
        this.itemIdentities = parent
            .getItemIdentities()
            .filter((_identity, index) => this.viewFilter(parent.getData()[index]));

        const synchronize = () => {
            const values: T[] = [];
            const identities: CollectionItemIdentity[] = [];
            const parentIdentities = this.parent.getItemIdentities();
            this.parent.getData().forEach((item, index) => {
                if (this.viewFilter(item)) {
                    values.push(item);
                    identities.push(parentIdentities[index]);
                }
            });
            this.inheritNextIdentities(identities);
            this.merge(values);
        };
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
                    const removeIndex = change.newState.slice(0, change.index).filter(this.viewFilter).length;
                    const removeCount = change.items.filter(this.viewFilter).length;
                    this.removeAt(removeIndex, removeCount);
                    break;
                case 'prepend':
                    filteredItems = change.items.filter(this.viewFilter);
                    if (filteredItems.length === 0) break;
                    this.inheritNextIdentities(
                        change.itemIdentities?.filter((_identity, index) => this.viewFilter(change.items[index]))
                    );
                    this.unshift(...filteredItems);
                    break;
                case 'append':
                    filteredItems = change.items.filter(this.viewFilter);
                    if (filteredItems.length === 0) break;
                    this.inheritNextIdentities(
                        change.itemIdentities?.filter((_identity, index) => this.viewFilter(change.items[index]))
                    );
                    this.appendArray(filteredItems);
                    break;
                case 'insert':
                    filteredItems = change.items.filter(this.viewFilter);
                    if (filteredItems.length === 0) break;
                    const insertIndex = change.newState.slice(0, change.index).filter(this.viewFilter).length;
                    this.inheritNextIdentities(
                        change.itemIdentities?.filter((_identity, index) => this.viewFilter(change.items[index]))
                    );
                    this.insertAt(insertIndex, ...filteredItems);
                    break;
                case 'merge':
                case 'swap':
                    synchronize();
                    break;
                case 'replace':
                    const index = change.newState.slice(0, change.index).filter(this.viewFilter).length;
                    const acceptOld = this.viewFilter(change.target);
                    const acceptNew = this.viewFilter(change.items[0]);
                    if (acceptOld && acceptNew) {
                        this.inheritNextIdentities(change.itemIdentities);
                        this.set(index, change.items[0]);
                    } else if (acceptOld) {
                        this.removeAt(index);
                    } else if (acceptNew) {
                        this.inheritNextIdentities(change.itemIdentities);
                        this.insertAt(index, change.items[0]);
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
        const values: T[] = [];
        const identities: CollectionItemIdentity[] = [];
        const parentIdentities = this.parent.getItemIdentities();
        this.parent.getData().forEach((item, index) => {
            if (this.viewFilter(item)) {
                values.push(item);
                identities.push(parentIdentities[index]);
            }
        });
        this.inheritNextIdentities(identities);
        this.merge(values);
    }
}

export class LimitedArrayView<T> extends ArrayDataSource<T> {
    constructor(parent: ArrayDataSource<T> | T[], sizeLimit: number, cancellationToken: CancellationToken = new CancellationToken(), name?: string) {
        if (Array.isArray(parent)) {
            parent = new ArrayDataSource(parent);
        }
        const initial = (parent as LimitedArrayView<T>).data.slice(0, sizeLimit);
        super(initial, name);
        updateAurumDevtoolsNode(this, { kind: 'array-view', metadata: { transformation: 'limit', sizeLimit } });
        this.itemIdentities = parent.getItemIdentities().slice(0, sizeLimit);

        const synchronize = () => {
            this.inheritNextIdentities(parent.getItemIdentities().slice(0, sizeLimit));
            this.merge(parent.getData().slice(0, sizeLimit));
        };

        parent.listen((change) => {
            if (change.operationDetailed === 'clear') this.clear();
            else synchronize();
        }, cancellationToken);
    }
}

export function processTransform<I, O>(
    operations: DataSourceOperator<any, any>[],
    result: DataSource<O>,
    cancellationToken: CancellationToken = CancellationToken.forever,
    startIndex = 0
): (input: I) => Promise<void> {
    return async (v: any) => {
        if (cancellationToken.isCancelled) return;
        try {
            for (let i = startIndex; i < operations.length; i++) {
                if (cancellationToken.isCancelled) return;
                const operation = operations[i];
                switch (operation.operationType) {
                    case OperationType.NOOP:
                        (operation as DataSourceMapOperator<any, any>).operation(v);
                        break;
                    case OperationType.SPREAD:
                        // One to many operation
                        v = (operation as DataSourceSpreadOperator<any, any>).operation(v);
                        for (const item of v) {
                            await processTransform(operations, result, cancellationToken, i + 1)(item);
                        }
                        return;
                    case OperationType.MAP:
                        v = (operation as DataSourceMapOperator<any, any>).operation(v);
                        break;
                    case OperationType.MAP_DELAY_FILTER:
                        const tmp = await (operation as DataSourceMapDelayFilterOperator<any, any>).operation(v);
                        if (tmp.cancelled || cancellationToken.isCancelled) {
                            return;
                        } else {
                            v = await tmp.item;
                        }
                        break;
                    case OperationType.DELAY:
                    case OperationType.MAP_DELAY:
                        v = await (operation as DataSourceMapOperator<any, any>).operation(v);
                        if (cancellationToken.isCancelled) return;
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
            if (!cancellationToken.isCancelled) result.update(v);
        } catch (e) {
            if (!cancellationToken.isCancelled) result.emitError(e);
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
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            registerAurumDevtoolsNode(this, { kind: 'map-data-source', getValue: (target) => target.toMap() });
        }
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            this.updateEvent.observeSubscriptionCount((count) => setAurumDevtoolsSubscriptionCount(this, count), false);
        }
    }

    public cancelAll(): void {
        this.updateEvent.cancelAll();
        this.updateEventOnKey.forEach((v, k) => v.cancelAll());
        this.updateEventOnKey.clear();
    }

    public static fromMultipleMaps<K, V>(maps: MapDataSource<K, V>[], cancellationToken?: CancellationToken): MapDataSource<K, V> {
        const result = new MapDataSource<K, V>();
        for (const map of maps) {
            linkAurumDevtoolsNodes(map, result, { kind: 'combine' }, cancellationToken);
            result.assign(map);
            map.listen((change) => {
                let valueSource: MapDataSource<K, V>;
                for (let index = maps.length - 1; index >= 0; index--) {
                    if (maps[index].has(change.key)) {
                        valueSource = maps[index];
                        break;
                    }
                }

                if (valueSource) {
                    result.set(change.key, valueSource.get(change.key));
                } else {
                    result.delete(change.key);
                }
            }, cancellationToken);
        }

        return result;
    }

    public toAsyncIterator(cancellation?: CancellationToken): AsyncIterableIterator<MapChange<K, V>> {
        return this.updateEvent.toAsyncIterator(undefined, cancellation);
    }

    public pipe(target: MapDataSource<K, V>, cancellation?: CancellationToken): void {
        linkAurumDevtoolsNodes(this, target, { kind: 'pipe' }, cancellation);
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
        if (change.deleted) {
            this.delete(change.key);
        } else {
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
        linkAurumDevtoolsNodes(this, subDataSource, { kind: 'derived', label: `key ${String(key)}` }, cancellationToken);

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
    public listen(callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): void {
        return this.updateEvent.subscribe(callback, cancellationToken);
    }

    /**
     * Same as listen but will immediately call the callback with the current value of each key
     */
    public listenAndRepeat(callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): void {
        const c = this.updateEvent.subscribe(callback, cancellationToken);
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
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'map' }, cancellation);
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

    public toKeysArrayDataSource(cancellation: CancellationToken): ArrayDataSource<K> {
        const result = new ArrayDataSource<K>();
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'keys' }, cancellation);
        this.listenAndRepeat((change) => {
            if (change.deleted) {
                result.remove(change.key);
            } else if (!change.deleted) {
                if (!result.includes(change.key)) {
                    result.push(change.key);
                }
            }
        }, cancellation);

        return result;
    }

    public toArrayDataSource(cancellation: CancellationToken): ArrayDataSource<V> {
        const stateMap: Map<K, V> = new Map<K, V>();
        const result = new ArrayDataSource<V>();
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'values' }, cancellation);
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

    public toEntriesArrayDataSource(cancellation: CancellationToken): ArrayDataSource<[K, V]> {
        const stateMap: Map<K, V> = new Map<K, V>();
        const result = new ArrayDataSource<[K, V]>();
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'entries' }, cancellation);
        this.listenAndRepeat((change) => {
            if (change.deleted && stateMap.has(change.key)) {
                const index = result.findIndex((v) => v[0] === change.key);
                result.removeAt(index);
                stateMap.delete(change.key);
            } else if (stateMap.has(change.key)) {
                const newItem = change.newValue;
                const index = result.findIndex((v) => v[0] === change.key);
                result.set(index, [change.key, newItem]);
                stateMap.set(change.key, newItem);
            } else if (!stateMap.has(change.key) && !change.deleted) {
                const newItem = change.newValue;
                result.push([change.key, newItem]);
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
    public listenOnKeyAndRepeat(key: K, callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): void {
        callback({
            key,
            newValue: this.data.get(key),
            oldValue: undefined
        });

        this.listenOnKey(key, callback, cancellationToken);
    }

    /**
     * Listen to changes of a single key of the object
     */
    public listenOnKey(key: K, callback: Callback<MapChange<K, V>>, cancellationToken?: CancellationToken): void {
        if (!this.updateEventOnKey.has(key)) {
            const event = new EventEmitter<MapChange<K, V>>();
            if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
                event.observeSubscriptionCount((count) => setAurumDevtoolsSubscriptionCount(this, count, `key:${String(key)}`), false);
            }
            this.updateEventOnKey.set(key, event);
        }
        const event = this.updateEventOnKey.get(key);
        return event.subscribe(callback, cancellationToken);
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
        const change: MapChange<K, V> = { oldValue: old, key, newValue: undefined, deleted: true };
        emitAurumDevtoolsUpdate(this, { kind: 'delete', value: this.data, details: { key } });
        this.updateEvent.fire(change);
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
        const change: MapChange<K, V> = { oldValue: old, key, newValue: this.data.get(key) };
        emitAurumDevtoolsUpdate(this, { kind: 'set', value: this.data, details: { key } });
        this.updateEvent.fire(change);
        if (this.updateEventOnKey.has(key)) {
            this.updateEventOnKey.get(key).fire({ oldValue: old, key, newValue: this.data.get(key) });
        }
    }

    public merge(newData: Map<K, V> | MapDataSource<K, V>): void {
        for (const key of newData.keys()) {
            this.set(key, newData.get(key));
        }

        for (const key of this.keys()) {
            if (!newData.has(key)) {
                this.delete(key);
            }
        }
    }

    public entries(): IterableIterator<[K, V]> {
        return this.data.entries();
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
    listen(callback: Callback<SetChange<K>>, cancellationToken?: CancellationToken): void;
    listenAndRepeat(callback: Callback<SetChange<K>>, cancellationToken?: CancellationToken): void;
    listenOnKeyAndRepeat(key: K, callback: Callback<boolean>, cancellationToken?: CancellationToken): void;
    listenOnKey(key: K, callback: Callback<boolean>, cancellationToken?: CancellationToken): void;
    map<D>(mapper: (key: K) => D): ReadOnlyArrayDataSource<D>;
    keys(): IterableIterator<K>;
    has(key: K): boolean;
    pickKey(key: K, cancellationToken?: CancellationToken): DataSource<boolean>;
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
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            registerAurumDevtoolsNode(this, { kind: 'set-data-source', getValue: (target) => target.toSet() });
        }
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            this.updateEvent.observeSubscriptionCount((count) => setAurumDevtoolsSubscriptionCount(this, count), false);
        }
    }

    public static fromAsyncIterator<T>(iterator: AsyncIterableIterator<T>, cancellation?: CancellationToken): SetDataSource<T> {
        const result = new SetDataSource<T>();

        (async () => {
            for await (const item of iterator) {
                if (cancellation?.isCancelled) {
                    return;
                }
                result.add(item);
            }
        })();

        return result;
    }

    public toAsyncIterator(cancellation?: CancellationToken): AsyncIterableIterator<SetChange<K>> {
        return this.updateEvent.toAsyncIterator(undefined, cancellation);
    }

    /**
     * Remove all listeners
     */
    public cancelAll(): void {
        this.updateEvent.cancelAll();
        this.updateEventOnKey.forEach((event) => event.cancelAll());
        this.updateEventOnKey.clear();
    }

    public applySetChange(change: SetChange<K>): void {
        if (change.exists) {
            this.add(change.key);
        } else {
            this.delete(change.key);
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
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'difference' }, cancellationToken);
        linkAurumDevtoolsNodes(otherSet as object, result, { kind: 'dependency', label: 'difference operand' }, cancellationToken);
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
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'union' }, cancellationToken);
        linkAurumDevtoolsNodes(otherSet as object, result, { kind: 'dependency', label: 'union operand' }, cancellationToken);

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
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'intersection' }, cancellationToken);
        linkAurumDevtoolsNodes(otherSet as object, result, { kind: 'dependency', label: 'intersection operand' }, cancellationToken);

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
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'symmetric difference' }, cancellationToken);
        linkAurumDevtoolsNodes(otherSet as object, result, { kind: 'dependency', label: 'symmetric difference operand' }, cancellationToken);

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
        linkAurumDevtoolsNodes(this, subDataSource, { kind: 'derived', label: `has ${String(key)}` }, cancellationToken);

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
    public listen(callback: Callback<SetChange<K>>, cancellationToken?: CancellationToken): void {
        this.updateEvent.subscribe(callback, cancellationToken);
    }

    /**
     * Same as listen but will immediately call the callback with the current value of each key
     */
    public listenAndRepeat(callback: Callback<SetChange<K>>, cancellationToken?: CancellationToken): void {
        this.updateEvent.subscribe(callback, cancellationToken);
        for (const key of this.data.keys()) {
            callback({
                key,
                exists: true
            });
        }
    }

    /**
     * Same as listenOnKey but will immediately call the callback with the current value first
     */
    public listenOnKeyAndRepeat(key: K, callback: Callback<boolean>, cancellationToken?: CancellationToken): void {
        callback(this.has(key));

        this.listenOnKey(key, callback, cancellationToken);
    }

    /**
     * Listen to changes of a single key of the object
     */
    public listenOnKey(key: K, callback: Callback<boolean>, cancellationToken?: CancellationToken): void {
        if (!this.updateEventOnKey.has(key)) {
            const event = new EventEmitter<boolean>();
            if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
                event.observeSubscriptionCount((count) => setAurumDevtoolsSubscriptionCount(this, count, `key:${String(key)}`), false);
            }
            this.updateEventOnKey.set(key, event);
        }
        const event = this.updateEventOnKey.get(key);
        event.subscribe(callback, cancellationToken);
    }

    public toArrayDataSource(cancellationToken?: CancellationToken): ReadOnlyArrayDataSource<K> {
        return this.map((key) => key, cancellationToken);
    }

    public map<D>(mapper: (key: K) => D, cancellationToken?: CancellationToken): ReadOnlyArrayDataSource<D> {
        const stateMap: Map<K, D> = new Map<K, D>();
        const result = new ArrayDataSource<D>();
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'map' }, cancellationToken);
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
     * Returns a datasource that reflects if the key exists in the set
     * @param key
     * @param cancellationToken
     * @returns
     */
    public pickKey(key: K, cancellationToken?: CancellationToken): DataSource<boolean> {
        const result = new DataSource(this.has(key));
        linkAurumDevtoolsNodes(this, result, { kind: 'derived', label: `has ${String(key)}` }, cancellationToken);
        this.listenOnKey(key, (v) => result.update(v), cancellationToken);
        return result;
    }

    /**
     * delete a key from the object
     * @param key
     * @param value
     */
    public delete(key: K): void {
        if (this.has(key)) {
            this.data.delete(key);
            const change = { key, exists: false };
            emitAurumDevtoolsUpdate(this, { kind: 'delete', value: this.data, details: { key } });
            this.updateEvent.fire(change);
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
        const change = { key, exists: true };
        emitAurumDevtoolsUpdate(this, { kind: 'add', value: this.data, details: { key } });
        this.updateEvent.fire(change);
        if (this.updateEventOnKey.has(key)) {
            this.updateEventOnKey.get(key).fire(true);
        }
    }

    public merge(newData: Set<K> | SetDataSource<K> | ReadOnlySetDataSource<K> | K[] | ArrayDataSource<K> | ReadOnlyArrayDataSource<K>): void {
        let newItems: Set<K>;
        if (newData instanceof SetDataSource) {
            newItems = newData.data;
        } else if (newData instanceof Set) {
            newItems = newData;
        } else if (newData instanceof ArrayDataSource) {
            newItems = new Set(newData.getData());
        } else {
            newItems = new Set(newData);
        }
        for (const item of this.data) {
            if (!newItems.has(item)) {
                this.delete(item);
            }
        }

        for (const item of newItems) {
            this.add(item);
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

/**
 * Only allows one update to propagate through the operations at a time. If a new update comes in while the previous one is still being processed it will be buffered and processed after the previous one is done
 */
export function dsCriticalSection<T, A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, I = H, J = I, K = J>(
    operationA: DataSourceOperator<T, A>,
    operationB?: DataSourceOperator<A, B>,
    operationC?: DataSourceOperator<B, C>,
    operationD?: DataSourceOperator<C, D>,
    operationE?: DataSourceOperator<D, E>,
    operationF?: DataSourceOperator<E, F>,
    operationG?: DataSourceOperator<F, G>,
    operationH?: DataSourceOperator<G, H>,
    operationI?: DataSourceOperator<H, I>,
    operationJ?: DataSourceOperator<I, J>,
    operationK?: DataSourceOperator<J, K>
): DataSourceMapDelayFilterOperator<T, K> {
    const definitions = [
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
    ].filter((v) => v !== undefined);

    const create = (cancellationToken: CancellationToken): DataSourceMapDelayFilterOperator<T, K> => {
        const operations = definitions.map((operation) => operation.bind?.({ cancellationToken }) ?? operation);
        const queue: Array<{
            value: T;
            resolve: (result: { item: K; cancelled: boolean }) => void;
            reject: (error: unknown) => void;
        }> = [];
        let active = false;
        cancellationToken.addCancellable(() => {
            for (const queued of queue.splice(0)) queued.resolve({ item: undefined as K, cancelled: true });
        });
        return {
            name: `CriticalSection<${operations.map((v) => v.name).join(', ')}>`,
            operationType: OperationType.MAP_DELAY_FILTER,
            operation: (value) => {
                if (!active) return execute(value);
                return new Promise((resolve, reject) => queue.push({ value, resolve, reject }));
            }
        };

        async function execute(value: T): Promise<{ item: K; cancelled: boolean }> {
            active = true;
            try {
                return cancellationToken.isCancelled
                    ? { item: undefined as K, cancelled: true }
                    : await processInlineTransform(operations, value, cancellationToken);
            } finally {
                active = false;
                const next = queue.shift();
                if (next) execute(next.value).then(next.resolve, next.reject);
            }
        }
    };
    const standaloneLifetime = new CancellationToken();
    const direct = create(standaloneLifetime);
    direct.bind = ({ cancellationToken }) => {
        standaloneLifetime.cancel();
        return create(cancellationToken);
    };
    return direct;
}

/**
 * If any of the operations throws the operation is repeated
 */
export function dsRetry<T, A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, I = H, J = I, K = J>(
    config: {
        retryCount: number;
        retryDelay?: number;
        shouldRetry?(error: any): boolean;
    },
    operationA: DataSourceOperator<T, A>,
    operationB?: DataSourceOperator<A, B>,
    operationC?: DataSourceOperator<B, C>,
    operationD?: DataSourceOperator<C, D>,
    operationE?: DataSourceOperator<D, E>,
    operationF?: DataSourceOperator<E, F>,
    operationG?: DataSourceOperator<F, G>,
    operationH?: DataSourceOperator<G, H>,
    operationI?: DataSourceOperator<H, I>,
    operationJ?: DataSourceOperator<I, J>,
    operationK?: DataSourceOperator<J, K>
): DataSourceMapDelayFilterOperator<T, K> {
    if (!Number.isInteger(config.retryCount) || config.retryCount < 0) throw new RangeError('retryCount must be a non-negative integer');
    if (config.retryDelay !== undefined && (!Number.isFinite(config.retryDelay) || config.retryDelay < 0)) {
        throw new RangeError('retryDelay must be a finite, non-negative number');
    }
    const definitions = [
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
    ].filter((v) => v !== undefined);

    const create = (cancellationToken: CancellationToken): DataSourceMapDelayFilterOperator<T, K> => {
        const operations = definitions.map((operation) => operation.bind?.({ cancellationToken }) ?? operation);
        return {
            name: `Retry<${operations.map((v) => v.name).join(', ')}>`,
            operationType: OperationType.MAP_DELAY_FILTER,
            operation: async (value) => {
                let lastError: unknown;
                for (let attempt = 0; attempt <= config.retryCount; attempt++) {
                    if (cancellationToken.isCancelled) return { item: undefined as K, cancelled: true };
                    if (attempt > 0 && config.retryDelay !== undefined) {
                        await cancellableDelay(config.retryDelay, cancellationToken);
                        if (cancellationToken.isCancelled) return { item: undefined as K, cancelled: true };
                    }
                    try {
                        return await processInlineTransform(operations, value, cancellationToken);
                    } catch (error) {
                        lastError = error;
                        if (config.shouldRetry && !config.shouldRetry(error)) throw error;
                    }
                }
                throw lastError;
            }
        };
    };
    const standaloneLifetime = new CancellationToken();
    const direct = create(standaloneLifetime);
    direct.bind = ({ cancellationToken }) => {
        standaloneLifetime.cancel();
        return create(cancellationToken);
    };
    return direct;
}

/**
 * Adds a list of operations that are only executed if the condition is met
 */
export function dsForkInline<T, A1, B1 = A1, C1 = B1, D1 = C1, E1 = D1, F1 = E1, G1 = F1, H1 = G1, I1 = H1>(
    condition: (value: T) => boolean,
    operationA: DataSourceOperator<T, A1>,
    operationB?: DataSourceOperator<A1, B1>,
    operationC?: DataSourceOperator<B1, C1>,
    operationD?: DataSourceOperator<C1, D1>,
    operationE?: DataSourceOperator<D1, E1>,
    operationF?: DataSourceOperator<E1, F1>,
    operationG?: DataSourceOperator<F1, G1>,
    operationH?: DataSourceOperator<G1, H1>,
    operationI?: DataSourceOperator<H1, I1>
): DataSourceMapDelayFilterOperator<T, T | I1> {
    const definitions = [operationA, operationB, operationC, operationD, operationE, operationF, operationG, operationH, operationI].filter(
        (v) => v !== undefined
    );
    const create = (cancellationToken: CancellationToken): DataSourceMapDelayFilterOperator<T, T | I1> => {
        const operations = definitions.map((operation) => operation.bind?.({ cancellationToken }) ?? operation);
        return {
            name: 'fork-inline',
            operationType: OperationType.MAP_DELAY_FILTER,
            operation: async (value) => {
                if (cancellationToken.isCancelled) return { item: undefined as I1, cancelled: true };
                if (condition(value)) {
                    return processInlineTransform(operations, value, cancellationToken);
                }
                return { item: value, cancelled: false };
            }
        };
    };
    const standaloneLifetime = new CancellationToken();
    const direct = create(standaloneLifetime);
    direct.bind = ({ cancellationToken }) => {
        standaloneLifetime.cancel();
        return create(cancellationToken);
    };
    return direct;
}

async function processInlineTransform(
    operations: DataSourceOperator<any, any>[],
    value: any,
    cancellationToken: CancellationToken = CancellationToken.forever
): Promise<{ item: any; cancelled: boolean }> {
    let out;
    let error;
    let hasValue = false;

    const sink = new DataSource();
    sink.listen((result) => {
        out = result;
        hasValue = true;
    });
    sink.handleErrors((e) => {
        error = e;
    });

    await processTransform(operations, sink, cancellationToken)(value);

    if (error) {
        throw error;
    }

    return { item: out, cancelled: !hasValue };
}

function cancellableDelay(time: number, cancellationToken: CancellationToken): Promise<void> {
    return new Promise((resolve) => {
        let settled = false;
        const finish = () => {
            if (!settled) {
                settled = true;
                resolve();
            }
        };
        const timeout = setTimeout(() => {
            if (!cancellationToken.isCancelled) cancellationToken.removeCancellable(cancel);
            finish();
        }, time);
        const cancel = () => {
            clearTimeout(timeout);
            finish();
        };
        cancellationToken.addCancellable(cancel);
    });
}
