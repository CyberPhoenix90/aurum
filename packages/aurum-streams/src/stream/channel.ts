import { CancellationToken } from '../utilities/cancellation_token.js';
import { DataPublisher, DataWriter } from '../utilities/common.js';
import { AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED, linkAurumDevtoolsNodes, registerAurumDevtoolsNode } from '../devtools.js';
import { DataSource, processTransform, ReadOnlyDataSource } from './data_source.js';
import { DataSourceOperator } from './operator_model.js';

/**
 * A typed, one-way processing channel. Values of type I are written to the input
 * while transformed values of type O are observed from the output.
 */
export class Channel<I, O = I> implements DataWriter<I>, DataPublisher<I> {
    public readonly input: DataSource<I>;
    public readonly output: ReadOnlyDataSource<O>;
    private readonly lifetime: CancellationToken;

    private constructor(input: DataSource<I>, output: ReadOnlyDataSource<O>, lifetime: CancellationToken) {
        this.input = input;
        this.output = output;
        this.lifetime = lifetime;
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            registerAurumDevtoolsNode(
                this,
                { kind: 'channel', name: this.name, getValue: (target) => target.value },
                lifetime
            );
            linkAurumDevtoolsNodes(input, this, { kind: 'channel-input' }, lifetime);
            linkAurumDevtoolsNodes(this, output as object, { kind: 'channel-output' }, lifetime);
        }
    }

    public get name(): string {
        return `IN:${this.input.name} OUT:${this.output.name}`;
    }

    public get value(): O {
        return this.output.value;
    }

    public get isDisposed(): boolean {
        return this.lifetime.isCancelled;
    }

    public static fromFunction<I, O>(processor: (value: I) => O | Promise<O>): Channel<I, O> {
        const input = new DataSource<I>();
        const output = new DataSource<O>();
        const lifetime = new CancellationToken();

        input.listen((value) => {
            try {
                const processed = processor(value);
                if (processed instanceof Promise) {
                    processed.then(
                        (result) => {
                            if (!lifetime.isCancelled) {
                                output.update(result);
                            }
                        },
                        (error) => {
                            if (!lifetime.isCancelled) {
                                output.emitError(error);
                            }
                        }
                    );
                } else {
                    output.update(processed);
                }
            } catch (error) {
                output.emitError(error);
            }
        }, lifetime);

        return new Channel(input, output, lifetime);
    }

    public static fromSources<I, O>(input?: DataSource<I>, output?: ReadOnlyDataSource<O>): Channel<I, O> {
        const inputSource = input ?? new DataSource<I>();
        return new Channel(inputSource, output ?? (inputSource as unknown as ReadOnlyDataSource<O>), new CancellationToken());
    }

    public static fromTransformation<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, J = H, K = J>(
        operationA: DataSourceOperator<A, B>,
        operationB?: DataSourceOperator<B, C>,
        operationC?: DataSourceOperator<C, D>,
        operationD?: DataSourceOperator<D, E>,
        operationE?: DataSourceOperator<E, F>,
        operationF?: DataSourceOperator<F, G>,
        operationG?: DataSourceOperator<G, H>,
        operationH?: DataSourceOperator<H, J>,
        operationI?: DataSourceOperator<J, K>
    ): Channel<A, K> {
        const input = new DataSource<A>();
        const output = new DataSource<K>();
        const lifetime = new CancellationToken();
        const operations = [operationA, operationB, operationC, operationD, operationE, operationF, operationG, operationH, operationI]
            .filter(Boolean)
            .map((operation) => operation.bind?.({ cancellationToken: lifetime }) ?? operation);
        input.listen(processTransform(operations, output, lifetime), lifetime);
        return new Channel(input, output, lifetime);
    }

    public update(value: I): void {
        if (this.lifetime.isCancelled) {
            return;
        }
        this.input.update(value);
    }

    public write(value: I): void {
        this.update(value);
    }

    public publish(value: I): void {
        this.update(value);
    }

    public transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, J = H, K = J>(
        operationA: DataSourceOperator<O, A>,
        operationB?: DataSourceOperator<A, B>,
        operationC?: DataSourceOperator<B, C>,
        operationD?: DataSourceOperator<C, D>,
        operationE?: DataSourceOperator<D, E>,
        operationF?: DataSourceOperator<E, F>,
        operationG?: DataSourceOperator<F, G>,
        operationH?: DataSourceOperator<G, H>,
        operationI?: DataSourceOperator<H, J>,
        operationJ?: DataSourceOperator<J, K>
    ): Channel<I, K> {
        if (this.lifetime.isCancelled) {
            throw new Error('Cannot transform a disposed channel');
        }
        const output = new DataSource<K>();
        const lifetime = new CancellationToken();
        const operations = [operationA, operationB, operationC, operationD, operationE, operationF, operationG, operationH, operationI, operationJ]
            .filter(Boolean)
            .map((operation) => operation.bind?.({ cancellationToken: lifetime }) ?? operation);
        this.output.listen(processTransform(operations, output, lifetime), lifetime);
        this.lifetime.addCancellable(lifetime);
        const result = new Channel(this.input, output, lifetime);
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: operations.map((operation) => operation.name).join(' → ') }, lifetime);
        return result;
    }

    /** Cancels only work owned by this channel and its derived channels. */
    public dispose(): void {
        this.lifetime.cancel();
    }
}

export function fetchRawChannel(url: string): Channel<void | RequestInit, Response> {
    return Channel.fromFunction((request) => fetch(url, request as RequestInit | undefined));
}

export function fetchPostJsonChannel<I, O>(url: string, baseRequestData?: RequestInit): Channel<I, O> {
    return Channel.fromFunction((value) =>
        fetch(url, {
            ...baseRequestData,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...baseRequestData?.headers
            },
            body: JSON.stringify(value)
        }).then((response) => response.json() as Promise<O>)
    );
}

export function fetchGetJsonChannel<O>(url: string, baseRequestData?: RequestInit): Channel<void, O> {
    return Channel.fromFunction(() => fetch(url, baseRequestData).then((response) => response.json() as Promise<O>));
}
