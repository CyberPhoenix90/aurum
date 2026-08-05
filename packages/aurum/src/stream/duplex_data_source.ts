import { AurumServerInfo, syncDuplexDataSource } from '../aurum_server/aurum_server_client.js';
import { CancellationToken } from '../utilities/cancellation_token.js';
import { Callback, DataWriter } from '../utilities/common.js';
import { EventEmitter } from '../utilities/event_emitter.js';
import { promiseIterator } from '../utilities/iteration.js';
import { DataSource } from './data_source.js';
import { DataFlow, ddsOneWayFlow } from './duplex_data_source_operators.js';
import {
    DuplexDataSourceDelayFilterOperator,
    DuplexDataSourceFilterOperator,
    DuplexDataSourceMapDelayFilterOperator,
    DuplexDataSourceMapOperator,
    DuplexDataSourceOperator,
    OperationType
} from './operator_model.js';

/**
 * A DataSource with an additional consumer-to-source write channel.
 * Downstream publications use the inherited DataSource implementation; only
 * upstream writes and bidirectional transforms are implemented here.
 */
export class DuplexDataSource<T> extends DataSource<T> implements DataWriter<T> {
    private updatingUpstream = false;
    private readonly updateUpstreamEvent = new EventEmitter<T>();
    private readonly propagateWritesToReadStream: boolean;

    constructor(initialValue?: T, rootNode: boolean = true, name: string = 'RootDuplexDataSource') {
        super(initialValue, name);
        this.propagateWritesToReadStream = rootNode;
    }

    public static fromRemoteSource<T>(aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): DuplexDataSource<T> {
        const result = new DuplexDataSource<T>(undefined, false);
        syncDuplexDataSource(result, aurumServerInfo, cancellation);
        return result;
    }

    public static fromAsyncIterator<T>(iterator: AsyncIterableIterator<T>, cancellation?: CancellationToken): DuplexDataSource<T> {
        const result = new DuplexDataSource<T>();
        (async () => {
            try {
                for await (const item of iterator) {
                    if (cancellation?.isCancelled) return;
                    result.publish(item);
                }
            } catch (error) {
                result.emitError(error, DataFlow.DOWNSTREAM);
            }
        })();
        return result;
    }

    public static fromPromise<T>(promise: Promise<T>, cancellation?: CancellationToken): DuplexDataSource<T> {
        const result = new DuplexDataSource<T>();
        promise.then(
            (value) => {
                if (!cancellation?.isCancelled) result.publish(value);
            },
            (error) => {
                if (!cancellation?.isCancelled) result.emitError(error, DataFlow.DOWNSTREAM);
            }
        );
        return result;
    }

    public static fromPromiseArray<T>(promises: Promise<T>[], cancellation?: CancellationToken): DuplexDataSource<T> {
        const result = new DuplexDataSource<T>();
        (async () => {
            for await (const promise of promiseIterator(promises, cancellation)) {
                if (cancellation?.isCancelled) return;
                if (promise.status === 'fulfilled') {
                    result.publish(promise.value);
                } else {
                    result.emitError(promise.reason, DataFlow.DOWNSTREAM);
                }
            }
        })();
        return result;
    }

    public static toDuplexDataSource<T>(value: T | DuplexDataSource<T>): DuplexDataSource<T> {
        return value instanceof DuplexDataSource ? value : new DuplexDataSource(value);
    }

    public static fromTwoDataSource<T>(
        downstream: DataSource<T>,
        upstream: DataSource<T>,
        initialValue?: T,
        propagateWritesToReadStream: boolean = true
    ): DuplexDataSource<T> {
        const result = new DuplexDataSource<T>(initialValue, propagateWritesToReadStream);
        downstream.listen((value) => result.publish(value));
        result.listenUpstream((value) => upstream.publish(value));
        return result;
    }

    public static createOneWay<T>(direction: DataFlow = DataFlow.DOWNSTREAM, initialValue?: T): DuplexDataSource<T> {
        return new DuplexDataSource(initialValue, false).transformDuplex(ddsOneWayFlow(direction));
    }

    /** Compatibility alias for a source-originated publication. */
    public updateDownstream(newValue: T): void {
        this.publish(newValue);
    }

    public override publish(newValue: T): void {
        super.update(newValue);
    }

    /** Consumer-originated writes flow upstream. */
    public override write(newValue: T): void {
        this.updateUpstream(newValue);
    }

    public updateUpstream(newValue: T): void {
        if ((newValue as any) === this) {
            throw new Error('Cannot update data source with itself');
        }
        if (this.updatingUpstream) {
            throw new Error(
                'Problem in data source: Unstable value propagation. An upstream write caused another synchronous upstream write'
            );
        }

        this.primed = true;
        this.updatingUpstream = true;
        this.value = newValue;
        try {
            this.updateUpstreamEvent.fire(newValue);
            if (this.propagateWritesToReadStream) {
                super.update(newValue);
            }
        } finally {
            this.updatingUpstream = false;
        }
    }

    public listenUpstream(callback: Callback<T>, cancellationToken?: CancellationToken): void {
        this.updateUpstreamEvent.subscribe(callback, cancellationToken);
    }

    public listenUpstreamAndRepeat(callback: Callback<T>, cancellationToken?: CancellationToken): void {
        if (this.primed) callback(this.value);
        this.listenUpstream(callback, cancellationToken);
    }

    public listenUpstreamOnce(callback: Callback<T>, cancellationToken?: CancellationToken): void {
        this.updateUpstreamEvent.subscribeOnce(callback, cancellationToken);
    }

    public listenDownstream(callback: Callback<T>, cancellationToken?: CancellationToken): void {
        this.listen(callback, cancellationToken);
    }

    public downStreamToDataSource(cancellationToken?: CancellationToken): DataSource<T> {
        const result = new DataSource(this.value);
        this.listen((value) => result.publish(value), cancellationToken);
        return result;
    }

    public transformDuplex<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, I = H, J = I, K = J>(
        operationA: DuplexDataSourceOperator<T, A>,
        operationB?: DuplexDataSourceOperator<A, B> | CancellationToken,
        operationC?: DuplexDataSourceOperator<B, C> | CancellationToken,
        operationD?: DuplexDataSourceOperator<C, D> | CancellationToken,
        operationE?: DuplexDataSourceOperator<D, E> | CancellationToken,
        operationF?: DuplexDataSourceOperator<E, F> | CancellationToken,
        operationG?: DuplexDataSourceOperator<F, G> | CancellationToken,
        operationH?: DuplexDataSourceOperator<G, H> | CancellationToken,
        operationI?: DuplexDataSourceOperator<H, I> | CancellationToken,
        operationJ?: DuplexDataSourceOperator<I, J> | CancellationToken,
        operationK?: DuplexDataSourceOperator<J, K> | CancellationToken,
        cancellationToken?: CancellationToken
    ): DuplexDataSource<K> {
        let token: CancellationToken;
        const operations = [
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
        ].filter((operation) => operation && (operation instanceof CancellationToken ? ((token = operation), false) : true)) as DuplexDataSourceOperator<any, any>[];
        token = cancellationToken ?? token;

        const result = new DuplexDataSource<K>(undefined, false, `${this.name} ${operations.map((operation) => operation.name).join(' ')}`);
        (this.primed ? this.listenAndRepeat : this.listen).call(this, processTransformDuplex(operations, result, DataFlow.DOWNSTREAM), token);
        result.listenUpstream(processTransformDuplex(operations, this as any, DataFlow.UPSTREAM), token);
        this.onError((error) => result.emitError(error, DataFlow.DOWNSTREAM), token);
        return result;
    }

    /** Creates a two-way connection to a regular DataSource. */
    public override pipe(targetDataSource: DataSource<T>, cancellationToken?: CancellationToken): this {
        this.listen((value) => targetDataSource.publish(value), cancellationToken);
        targetDataSource.listen((value) => this.write(value), cancellationToken);
        return this;
    }

    public override cancelAll(): void {
        super.cancelAll();
        this.updateUpstreamEvent.cancelAll();
    }

    public cancelAllDownstream(): void {
        super.cancelAll();
    }

    public cancelAllUpstream(): void {
        this.updateUpstreamEvent.cancelAll();
    }

    public override emitError(error: Error, direction: DataFlow = DataFlow.DOWNSTREAM): void {
        if (direction === DataFlow.DOWNSTREAM) {
            super.emitError(error);
            return;
        }

        if (this.errorHandler) {
            try {
                this.write(this.errorHandler(error));
                return;
            } catch (newError) {
                error = newError;
            }
        }
        if (this.errorEvent.hasSubscriptions()) {
            this.errorEvent.fire(error);
        } else {
            throw error;
        }
    }
}

export function processTransformDuplex<I, O>(
    operations: DuplexDataSourceOperator<any, any>[],
    result: DuplexDataSource<O>,
    direction: DataFlow
): Callback<I> {
    return async (input: any) => {
        let value = input;
        try {
            for (const operation of operations) {
                switch (operation.operationType) {
                    case OperationType.NOOP:
                    case OperationType.MAP:
                        value =
                            direction === DataFlow.DOWNSTREAM
                                ? (operation as DuplexDataSourceMapOperator<any, any>).operationDown(value)
                                : (operation as DuplexDataSourceMapOperator<any, any>).operationUp(value);
                        break;
                    case OperationType.MAP_DELAY_FILTER: {
                        const transformed =
                            direction === DataFlow.DOWNSTREAM
                                ? await (operation as DuplexDataSourceMapDelayFilterOperator<any, any>).operationDown(value)
                                : await (operation as DuplexDataSourceMapDelayFilterOperator<any, any>).operationUp(value);
                        if (transformed.cancelled) return;
                        value = await transformed.item;
                        break;
                    }
                    case OperationType.DELAY:
                    case OperationType.MAP_DELAY:
                        value =
                            direction === DataFlow.DOWNSTREAM
                                ? await (operation as DuplexDataSourceMapOperator<any, any>).operationDown(value)
                                : await (operation as DuplexDataSourceMapOperator<any, any>).operationUp(value);
                        break;
                    case OperationType.DELAY_FILTER:
                        if (
                            !(direction === DataFlow.DOWNSTREAM
                                ? await (operation as DuplexDataSourceDelayFilterOperator<any>).operationDown(value)
                                : await (operation as DuplexDataSourceDelayFilterOperator<any>).operationUp(value))
                        ) {
                            return;
                        }
                        break;
                    case OperationType.FILTER:
                        if (
                            !(direction === DataFlow.DOWNSTREAM
                                ? (operation as DuplexDataSourceFilterOperator<any>).operationDown(value)
                                : (operation as DuplexDataSourceFilterOperator<any>).operationUp(value))
                        ) {
                            return;
                        }
                        break;
                }
            }
            if (direction === DataFlow.DOWNSTREAM) result.publish(value);
            else result.write(value);
        } catch (error) {
            result.emitError(error, direction);
        }
    };
}
