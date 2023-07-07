import {
    DataSourceDelayFilterOperator,
    DataSourceFilterOperator,
    DataSourceMapDelayFilterOperator,
    DataSourceMapOperator,
    DataSourceOperator,
    OperationType
} from '../stream/operator_model';
import { CancellationToken } from './cancellation_token';

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
        if (token?.isCanceled) {
            return;
        }
        const i = await transform(v);
        if (i !== FILTERED) {
            yield i;
        }
    }

    return;
}

export function promiseIterator<T>(promises: Promise<T>[], cancellation?: CancellationToken): AsyncIterableIterator<PromiseSettledResult<T>> {
    let toResolve = promises.length;
    let resolve: (value: PromiseSettledResult<T>) => void;
    let promise = new Promise<PromiseSettledResult<T>>((res) => {
        resolve = res;
    });
    for (const p of promises) {
        p.then(
            (v) => {
                toResolve--;
                resolve({
                    status: 'fulfilled',
                    value: v
                });
                if (toResolve > 0) {
                    promise = new Promise<PromiseSettledResult<T>>((res, rej) => {
                        resolve = res;
                    });
                }
            },
            (e) => {
                toResolve--;
                resolve({
                    status: 'rejected',
                    reason: e
                });
                if (toResolve > 0) {
                    promise = new Promise<PromiseSettledResult<T>>((res, rej) => {
                        resolve = res;
                    });
                }
            }
        );
    }

    let currentResolve;
    if (cancellation) {
        cancellation.addCancelable(() => {
            currentResolve({
                done: true,
                value: undefined
            });
        });
    }

    return {
        [Symbol.asyncIterator](): AsyncIterableIterator<PromiseSettledResult<T>> {
            return this;
        },
        next(): Promise<IteratorResult<PromiseSettledResult<T>>> {
            if (cancellation?.isCanceled) {
                return Promise.resolve({
                    done: true,
                    value: undefined
                });
            }

            return new Promise((res, rej) => {
                currentResolve = res;
                if (toResolve === 0) {
                    return {
                        done: true,
                        value: undefined
                    };
                }
                return {
                    done: false,
                    value: promise.then(
                        (v) => {
                            currentResolve = undefined;
                            return v;
                        },
                        (e) => {
                            currentResolve = undefined;
                            throw e;
                        }
                    )
                };
            });
        }
    };
}
