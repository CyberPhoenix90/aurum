import { DataSource } from '../stream/data_source.js';
import {
    DataSourceDelayFilterOperator,
    DataSourceFilterOperator,
    DataSourceMapDelayFilterOperator,
    DataSourceMapOperator,
    DataSourceOperator,
    OperationType
} from '../stream/operator_model.js';
import { CancellationToken } from './cancellation_token.js';

const FILTERED = Symbol('filtered');
export async function* transformAsyncIterator<T, A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, I = H, J = I, K = J>(
    asyncIterator: AsyncGenerator<T>,
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
): AsyncGenerator<K> {
    let token: CancellationToken;
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

    const transform = async (v: any) => {
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
                            return FILTERED;
                        }
                        break;
                    case OperationType.FILTER:
                        if (!(operation as DataSourceFilterOperator<any>).operation(v)) {
                            return FILTERED;
                        }
                        break;
                }
            }

            return v;
        } catch (e) {
            throw e;
        }
    };

    for await (const v of asyncIterator) {
        if (token?.isCancelled) {
            return;
        }
        const i = await transform(v);
        if (i !== FILTERED) {
            yield i;
        }
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
