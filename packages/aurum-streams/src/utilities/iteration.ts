import { DataSource } from '../stream/data_source.js';
import {
    DataSourceDelayFilterOperator,
    DataSourceFilterOperator,
    DataSourceMapDelayFilterOperator,
    DataSourceMapOperator,
    DataSourceOperator,
    DataSourceOperatorOutput,
    DataSourceSpreadOperator,
    DataSourceTransformRestArguments,
    OperationType
} from '../stream/operator_model.js';
import { CancellationToken } from './cancellation_token.js';

export function transformAsyncIterator<T, A, B = A, C = B, D = C, E = D, F = E, G = F, H = G>(
    asyncIterator: Generator<T> | AsyncGenerator<T>,
    first: DataSourceOperator<T, A>, second?: DataSourceOperator<A, B> | CancellationToken,
    third?: DataSourceOperator<B, C> | CancellationToken, fourth?: DataSourceOperator<C, D> | CancellationToken,
    fifth?: DataSourceOperator<D, E> | CancellationToken, sixth?: DataSourceOperator<E, F> | CancellationToken,
    seventh?: DataSourceOperator<F, G> | CancellationToken, eighth?: DataSourceOperator<G, H> | CancellationToken,
    cancellationToken?: CancellationToken
): AsyncGenerator<H>;
export function transformAsyncIterator<T, FirstOutput, const Operators extends readonly DataSourceOperator<any, any>[]>(
    asyncIterator: Generator<T> | AsyncGenerator<T>,
    first: DataSourceOperator<T, FirstOutput>,
    ...rest: DataSourceTransformRestArguments<FirstOutput, Operators>
): AsyncGenerator<DataSourceOperatorOutput<FirstOutput, Operators>>;
export async function* transformAsyncIterator<T>(
    asyncIterator: Generator<T> | AsyncGenerator<T>,
    first: DataSourceOperator<T, any>,
    ...rest: Array<DataSourceOperator<any, any> | CancellationToken>
): AsyncGenerator<any> {
    const args: Array<DataSourceOperator<any, any> | CancellationToken> = [first, ...rest];
    const lastArgument = args[args.length - 1];
    const suppliedToken = lastArgument instanceof CancellationToken ? lastArgument : undefined;
    const definitions = (suppliedToken ? args.slice(0, -1) : args).filter(Boolean) as DataSourceOperator<any, any>[];
    const token = suppliedToken ?? new CancellationToken();
    const operations = definitions.map((operation) => operation.bind?.({ cancellationToken: token }) ?? operation);

    const transform = async (v: any, startIndex = 0): Promise<any[]> => {
        try {
            for (let index = startIndex; index < operations.length; index++) {
                if (token.isCancelled) return [];
                const operation = operations[index];
                switch (operation.operationType) {
                    case OperationType.NOOP:
                        (operation as DataSourceMapOperator<any, any>).operation(v);
                        break;
                    case OperationType.MAP:
                        v = (operation as DataSourceMapOperator<any, any>).operation(v);
                        break;
                    case OperationType.SPREAD: {
                        const output: any[] = [];
                        for (const item of (operation as DataSourceSpreadOperator<any, any>).operation(v)) {
                            output.push(...(await transform(item, index + 1)));
                        }
                        return output;
                    }
                    case OperationType.MAP_DELAY_FILTER:
                        const tmp = await (operation as DataSourceMapDelayFilterOperator<any, any>).operation(v);
                        if (tmp.cancelled) {
                            return [];
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
                            return [];
                        }
                        break;
                    case OperationType.FILTER:
                        if (!(operation as DataSourceFilterOperator<any>).operation(v)) {
                            return [];
                        }
                        break;
                }
            }

            return token.isCancelled ? [] : [v];
        } catch (e) {
            throw e;
        }
    };

    for await (const v of asyncIterator) {
        if (token?.isCancelled) {
            return;
        }
        for (const item of await transform(v)) yield item;
    }

    return;
}

export async function* readableStreamStringIterator(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    itemSeperatorSequence: string,
    onDone?: () => void
): AsyncGenerator<string> {
    const decoder = new TextDecoder('utf-8');
    let buffer: string = '';
    for await (const chunk of readableStreamBinaryIterator(reader)) {
        buffer += decoder.decode(chunk, { stream: true });
        const parts = buffer.split(itemSeperatorSequence);
        for (let i = 0; i < parts.length - 1; i++) {
            yield parts[i];
        }
        buffer = parts[parts.length - 1];
    }

    if (buffer.length > 0) {
        yield buffer;
    }

    onDone?.();
}

export async function* readableStreamBinaryIterator(reader: ReadableStreamDefaultReader<Uint8Array>, onDone?: () => void): AsyncGenerator<Uint8Array> {
    while (true) {
        const { done, value } = await reader.read();
        if (!done) {
            yield value;
        } else {
            if (onDone) {
                onDone();
            }
            return;
        }
    }
}

export function promiseIterator<T>(promises: Promise<T>[], cancellation?: CancellationToken): AsyncIterableIterator<PromiseSettledResult<T>> {
    let pendingCount = promises.length;
    const output = new DataSource<PromiseSettledResult<T>>();
    cancellation = cancellation ?? new CancellationToken();

    for (const promise of promises) {
        promise.then(
            (v) => {
                pendingCount--;

                output.update({
                    status: 'fulfilled',
                    value: v
                });

                if (pendingCount === 0) {
                    cancellation.cancel();
                }
            },
            (e) => {
                pendingCount--;
                output.update({
                    status: 'rejected',
                    reason: e
                });
                if (pendingCount === 0) {
                    cancellation.cancel();
                }
            }
        );
    }

    return output.toAsyncIterator(cancellation);
}
