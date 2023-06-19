import { DataSourceOperator } from './operator_model.js';
import { CancellationToken } from '../utilities/cancellation_token.js';
import { Callback } from '../utilities/common.js';
import { DataSource, processTransform, ReadOnlyDataSource } from './data_source.js';

/**
 * Lets you logically combine 2 data sources so that update calls go through the input source and listen goes to the output source
 */
export class Stream<I, O = I> implements ReadOnlyDataSource<O> {
    private input: DataSource<I>;
    private output: DataSource<O>;
    public get name(): string {
        return `IN:${this.input.name} OUT:${this.output.name}`;
    }
    /**
     * The current value of this data source, can be changed through update
     */
    public get value(): O {
        return this.output.value;
    }

    private constructor() {}

    public static fromFunction<I, O>(func: (value: I) => O): Stream<I, O> {
        const result = new Stream<I, O>();
        result.input = new DataSource<I>();
        result.output = new DataSource<O>();

        result.input.listen((value) => {
            result.output.update(func(value));
        });

        return result;
    }

    public static fromFetchRaw(url: string): Stream<void | RequestInit, Promise<Response>> {
        const input = new DataSource<void | RequestInit>();
        const output = new DataSource<Promise<Response>>();

        input.listen((value) => {
            output.update(fetch(url, value as RequestInit));
        });

        return Stream.fromPreconnectedSources(input, output);
    }

    public static fromPreconnectedSources<I, O>(inputSource?: DataSource<I>, outputSource?: DataSource<O>): Stream<I, O> {
        const result = new Stream<I, O>();
        result.input = inputSource ?? new DataSource();
        result.output = outputSource ?? (result.input as any);

        return result;
    }

    /**
     * Combines two sources into a third source that listens to updates from both parent sources.
     * @param otherSource Second parent for the new source
     * @param combinator Method allowing you to combine the data from both parents on update. Called each time a parent is updated with the latest values of both parents
     * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
     */
    public aggregate<R, A>(otherSources: [ReadOnlyDataSource<A>], combinator: (self: O, other: A) => R, cancellationToken?: CancellationToken): DataSource<R>;
    public aggregate<R, A, B>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>],
        combinator?: (self: O, second: A, third: B) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public aggregate<R, A, B, C>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>],
        combinator?: (self: O, second: A, third: B, fourth: C) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public aggregate<R, A, B, C, D>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>],
        combinator?: (self: O, second: A, third: B, fourth: C, fifth: D) => R,
        cancellationToken?: CancellationToken
    ): DataSource<R>;
    public aggregate<R, A, B, C, D, E>(
        otherSources: [ReadOnlyDataSource<A>, ReadOnlyDataSource<B>, ReadOnlyDataSource<C>, ReadOnlyDataSource<D>, ReadOnlyDataSource<E>],
        combinator?: (self: O, second: A, third: B, fourth: C, fifth: D, sixth: E) => R,
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
        combinator?: (self: O, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F) => R,
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
        combinator?: (self: O, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G) => R,
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
        combinator?: (self: O, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H) => R,
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
        combinator?: (self: O, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H) => R,
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
        combinator?: (self: O, second: A, third: B, fourth: C, fifth: D, sixth: E, seventh: F, eigth: G, ninth: H, tenth: I) => R,
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

    public static fromStreamTransformation<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, Z = H, J = Z, K = J>(
        operationA?: DataSourceOperator<A, B>,
        operationB?: DataSourceOperator<B, C>,
        operationC?: DataSourceOperator<C, D>,
        operationD?: DataSourceOperator<D, E>,
        operationE?: DataSourceOperator<E, F>,
        operationF?: DataSourceOperator<F, G>,
        operationG?: DataSourceOperator<G, H>,
        operationH?: DataSourceOperator<H, Z>,
        operationI?: DataSourceOperator<Z, J>,
        operationJ?: DataSourceOperator<J, K>
    ): Stream<A, K> {
        const result = new Stream<A, K>();

        result.input = new DataSource<A>();
        result.output = result.input.transform(
            operationA,
            operationB,
            operationC,
            operationD,
            operationE,
            operationF,
            operationG,
            operationH,
            operationI,
            operationJ
        );

        return result;
    }

    public static fromFetchPostJson<I, O>(url: string, baseRequestData?: RequestInit): Stream<I, O> {
        const input = new DataSource<I>();
        const output = new DataSource<O>();

        input.listen(async (value) => {
            output.update(
                await fetch(
                    url,
                    Object.assign(
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        } as RequestInit,
                        baseRequestData,
                        {
                            body: JSON.stringify(value)
                        } as RequestInit
                    )
                ).then((s) => s.json())
            );
        });

        return Stream.fromPreconnectedSources(input, output);
    }

    public static fromFetchGetJson<O>(url: string, baseRequestData?: RequestInit): Stream<void, O> {
        const input = new DataSource<void>();
        const output = new DataSource<O>();

        input.listen(async () => {
            output.update(await fetch(url).then((s) => s.json()));
        });

        return Stream.fromPreconnectedSources(input, output);
    }

    public update(data: I): void {
        this.input.update(data);
    }

    public transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, Z = H, J = Z, K = J>(
        operationA: DataSourceOperator<O, A>,
        operationB?: DataSourceOperator<A, B> | CancellationToken,
        operationC?: DataSourceOperator<B, C> | CancellationToken,
        operationD?: DataSourceOperator<C, D> | CancellationToken,
        operationE?: DataSourceOperator<D, E> | CancellationToken,
        operationF?: DataSourceOperator<E, F> | CancellationToken,
        operationG?: DataSourceOperator<F, G> | CancellationToken,
        operationH?: DataSourceOperator<G, H> | CancellationToken,
        operationI?: DataSourceOperator<H, Z> | CancellationToken,
        operationJ?: DataSourceOperator<Z, J> | CancellationToken,
        operationK?: DataSourceOperator<J, K> | CancellationToken,
        cancellationToken?: CancellationToken
    ): Stream<I, K> {
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
        const result = new DataSource<K>(undefined, this.output.name + ' ' + operations.map((v) => v.name).join(' '));
        this.listen(processTransform<O, K>(operations as any, result), token);

        return Stream.fromPreconnectedSources(this.input, result);
    }

    public getInput(): DataSource<I> {
        return this.input;
    }

    public getOutput(): DataSource<O> {
        return this.output;
    }

    public listen(callback: Callback<O>, cancellationToken?: CancellationToken): Callback<void> {
        return this.output.listen(callback, cancellationToken);
    }

    public listenAndRepeat(callback: Callback<O>, cancellationToken?: CancellationToken): Callback<void> {
        return this.output.listenAndRepeat(callback, cancellationToken);
    }

    public listenOnce(callback: Callback<O>, cancellationToken?: CancellationToken): Callback<void> {
        return this.output.listenOnce(callback, cancellationToken);
    }

    public awaitNextUpdate(cancellationToken?: CancellationToken): Promise<O> {
        return this.output.awaitNextUpdate(cancellationToken);
    }

    public cancelAll(): void {
        this.input.cancelAll();
        this.output.cancelAll();
    }
}
