import { ReadOnlyDataSource, DataSource, ArrayDataSource, CancellationToken, dsUpdateToken, dsDiff } from 'aurumjs';

export type ReadonlyData<T> = Readonly<T> | ReadOnlyDataSource<T>;
export type Data<T> = T | DataSource<T>;
export type ArrayData<T> = T[] | ArrayDataSource<T>;

export interface DataPointLike {
    x: Data<number>;
    y: Data<number>;
}

export function tx<A extends Data<any> | Data<any>[], B extends Data<any> | Data<any>[]>(
    lifeCycle: CancellationToken,
    sources: A,
    ...operations: [(lifeCycle: CancellationToken, sources: A) => B]
): B;
export function tx<A extends Data<any> | Data<any>[], B extends Data<any> | Data<any>[], C extends Data<any> | Data<any>[]>(
    lifeCycle: CancellationToken,
    sources: A,
    ...operations: [(lifeCycle: CancellationToken, sources: A) => B, (lifeCycle: CancellationToken, sources: B) => C]
): C;
export function tx(
    lifeCycle: CancellationToken,
    sources: Data<any> | Data<any>[],
    ...operations: [(lifeCycle: CancellationToken, sources: Data<any>[]) => Data<any>]
): Data<any> {
    for (const operation of operations) {
        sources = operation(lifeCycle, sources);
    }

    return sources;
}

export function aggregate<A, B>(callback: (...values: [Data<A>]) => Data<B>): (lifeCycle: CancellationToken, sources: [Data<A>]) => Data<B>;
export function aggregate<A, B, C>(
    callback: (...values: [Data<A>, Data<B>]) => Data<C>
): (lifeCycle: CancellationToken, sources: [Data<A>, Data<B>]) => Data<C>;
export function aggregate<A, B, C, D>(
    callback: (...values: [Data<A>, Data<B>, Data<C>]) => Data<D>
): (lifeCycle: CancellationToken, sources: [Data<A>, Data<B>, Data<C>]) => Data<D>;
export function aggregate<A, B, C, D, E>(
    callback: (...values: [Data<A>, Data<B>, Data<C>, Data<D>]) => Data<E>
): (lifeCycle: CancellationToken, sources: [Data<A>, Data<B>, Data<C>, Data<D>]) => Data<E>;
export function aggregate<A, B, C, D, E, F>(
    callback: (...values: [Data<A>, Data<B>, Data<C>, Data<D>, Data<E>]) => Data<F>
): (lifeCycle: CancellationToken, sources: [Data<A>, Data<B>, Data<C>, Data<D>, Data<E>]) => Data<F>;
export function aggregate<A, B, C, D, E, F, G>(
    callback: (...values: [Data<A>, Data<B>, Data<C>, Data<D>, Data<E>, Data<F>]) => Data<G>
): (lifeCycle: CancellationToken, sources: [Data<A>, Data<B>, Data<C>, Data<D>, Data<E>, Data<F>]) => Data<G>;
export function aggregate(callback: (...values: Data<any>) => Data<any>): (lifeCycle: CancellationToken, sources: Data<any>[]) => Data<any> {
    return (lifeCycle: CancellationToken, sources: Data<any>[]): Data<any> => {
        if (isDynamic(sources)) {
            const result = new DataSource(callback(...sources));
            for (const source of sources) {
                if (source instanceof DataSource) {
                    source.listen((v) => {
                        result.update(callback(...sources.map((s) => readData(s))));
                    }, lifeCycle);
                }
            }
        } else {
            return callback(...sources);
        }
    };
}

export function sumReduce(lifeCycle: CancellationToken, sources: Data<number>[]): Data<number> {
    const result: Data<number> = isDynamic(sources) ? new DataSource(0) : 0;
    for (const source of sources) {
        pipeData(
            tx(lifeCycle, source, diff),
            ({ newValue, oldValue }) => {
                writeData(result, readData(result) + newValue - oldValue);
            },
            lifeCycle
        );
    }

    return result;
}

export function mulReduce(lifeCycle: CancellationToken, sources: Data<number>[]): Data<number> {
    const result: Data<number> = isDynamic(sources) ? new DataSource(1) : 1;
    for (const source of sources) {
        pipeData(
            tx(lifeCycle, source, diff),
            ({ newValue, oldValue }) => {
                writeData(result, (readData(result) * newValue) / oldValue);
            },
            lifeCycle
        );
    }

    return result;
}

export function mulConst(scalar: number): (lifeCycle: CancellationToken, source: Data<number>) => Data<number> {
    return (lifeCycle: CancellationToken, source: Data<number>): Data<number> => {
        let result = source instanceof DataSource ? source.value : source;
        pipeData(
            source,
            (value) => {
                writeData(result, value * scalar);
            },
            lifeCycle
        );
        return result;
    };
}

export function mulConstArray(scalar: number): (lifeCycle: CancellationToken, sources: Data<number>[]) => Data<number>[] {
    return (lifeCycle: CancellationToken, sources: Data<number>[]): Data<number>[] => {
        const results = [];

        let i = 0;
        for (const source of sources) {
            let index = i++;
            results.push(source instanceof DataSource ? source.value : source);
            pipeData(
                source,
                (value) => {
                    writeData(results[index], value * scalar);
                },
                lifeCycle
            );
        }
        return results;
    };
}

export function diff<T>(lifeCycle: CancellationToken, source: Data<T>): Data<{ newValue: T; oldValue: T }> {
    if (source instanceof DataSource) {
        return source.transform(dsDiff(), lifeCycle);
    } else {
        return {
            newValue: source,
            oldValue: undefined
        };
    }
}

function isDynamic<T>(data: Data<T>[]): boolean {
    for (const source of data) {
        if (source instanceof DataSource) {
            return true;
        }
    }
    return false;
}

export function syncData<T>(fromData: Data<T>, toData: Data<T>, lifeCycle: CancellationToken): void {
    pipeData(
        fromData,
        (value: T) => {
            writeData(toData, value);
        },
        lifeCycle
    );
}

export function syncDataDuplex<T>(fromData: Data<T>, toData: Data<T>, lifeCycle: CancellationToken): void {
    pipeData(
        fromData,
        (value: T) => {
            if (value != readData(toData)) {
                writeData(toData, value);
            }
        },
        lifeCycle
    );

    pipeData(
        toData,
        (value: T) => {
            if (value != readData(fromData)) {
                writeData(fromData, value);
            }
        },
        lifeCycle
    );
}

export function readData<T>(data: Data<T>): T {
    if (data instanceof DataSource) {
        return data.value;
    } else {
        return data;
    }
}

export function pipeData<T>(data: Data<T>, read: (data: T, valueLifetimeToken: CancellationToken) => void, lifeCycle: CancellationToken): void {
    if (data instanceof DataSource) {
        data.transform(dsUpdateToken()).listenAndRepeat(({ token, value }) => {
            read(value, token);
        }, lifeCycle);
    } else {
        read(data, CancellationToken.forever);
    }
}

export function writeData<T>(data: Data<T>, value: T): void {
    if (data instanceof DataSource) {
        data.update(value);
    } else {
        data = value;
    }
}
