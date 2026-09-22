import { afterEach, assert, describe, it, vi } from 'vitest';
import {
    CancellationToken,
    DataSource,
    dsCriticalSection,
    dsFilter,
    dsForkInline,
    dsMap,
    dsMapAsync,
    dsRetry
} from '../src/index.js';

const turn = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('advanced stream primitives', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('takes an exact finite number of values and exposes iterator identity', async () => {
        const source = new DataSource<number>();
        const iterator = source.take(3);
        assert.strictEqual(iterator[Symbol.asyncIterator](), iterator);
        const first = iterator.next();
        source.update(1);
        assert.deepEqual(await first, { done: false, value: 1 });
        const second = iterator.next();
        source.update(2);
        assert.deepEqual(await second, { done: false, value: 2 });
        const third = iterator.next();
        source.update(3);
        assert.deepEqual(await third, { done: false, value: 3 });
        assert.deepEqual(await iterator.next(), { done: true, value: undefined });
    });

    it('ends finite iteration immediately for an already-cancelled lifetime', async () => {
        const token = new CancellationToken();
        token.cancel();
        const iterator = new DataSource<number>().take(2, token);
        assert.strictEqual(iterator[Symbol.asyncIterator](), iterator);
        assert.deepEqual(await iterator.next(), { done: true, value: undefined });
    });

    it('adapts promise arrays and sends rejected promises to the error channel', async () => {
        const source = DataSource.fromPromiseArray([Promise.resolve(1), Promise.reject(new Error('bad')), Promise.resolve(2)]);
        const values: number[] = [];
        const errors: string[] = [];
        source.listen((value) => values.push(value));
        source.onError((error) => errors.push(error.message));
        await turn();
        assert.deepEqual(values, [1, 2]);
        assert.deepEqual(errors, ['bad']);
    });

    it('routes asynchronous iterator failures to the error channel', async () => {
        async function* values() {
            await Promise.resolve();
            yield 1;
            throw new Error('failed iterator');
        }
        const source = DataSource.fromAsyncIterator(values());
        const errors: string[] = [];
        source.onError((error) => errors.push(error.message));
        await turn();
        assert.equal(source.value, 1);
        assert.deepEqual(errors, ['failed iterator']);
    });

    it('serializes critical-section work and preserves input order', async () => {
        const source = new DataSource<number>();
        const started: number[] = [];
        const resolvers = new Map<number, (value: number) => void>();
        const output = source.transform(
            dsCriticalSection(
                dsMapAsync((value: number) => {
                    started.push(value);
                    return new Promise<number>((resolve) => resolvers.set(value, resolve));
                }),
                dsMap((value) => value * 10)
            )
        );
        const values: number[] = [];
        output.listen((value) => values.push(value));

        source.update(1);
        source.update(2);
        source.update(3);
        assert.deepEqual(started, [1]);
        resolvers.get(1)?.(1);
        await turn();
        assert.deepEqual(started, [1, 2]);
        resolvers.get(2)?.(2);
        await turn();
        assert.deepEqual(started, [1, 2, 3]);
        resolvers.get(3)?.(3);
        await turn();
        assert.deepEqual(values, [10, 20, 30]);
    });

    it('cancels active and queued critical-section work', async () => {
        const source = new DataSource<number>();
        const token = new CancellationToken();
        let resolve!: (value: number) => void;
        const output = source.transform(dsCriticalSection(dsMapAsync((value: number) => new Promise<number>((done) => (resolve = done)))), token);
        const values: number[] = [];
        output.listen((value) => values.push(value));
        source.update(1);
        source.update(2);
        token.cancel();
        resolve(1);
        await turn();
        assert.deepEqual(values, []);
    });

    it('forks inline only for matching values and preserves filtered cancellation', async () => {
        const source = new DataSource<number>();
        const output = source.transform(
            dsForkInline(
                (value) => value % 2 === 0,
                dsMap((value) => value * 10),
                dsFilter((value) => value < 30)
            )
        );
        const values: number[] = [];
        output.listen((value) => values.push(value));
        source.update(1);
        source.update(2);
        source.update(4);
        await turn();
        assert.deepEqual(values, [1, 20]);
    });

    it('validates retry policies and reports the final exhausted error', async () => {
        assert.throws(() => dsRetry({ retryCount: -1 }, dsMap((value: number) => value)), RangeError);
        assert.throws(() => dsRetry({ retryCount: 1.5 }, dsMap((value: number) => value)), RangeError);
        assert.throws(() => dsRetry({ retryCount: 1, retryDelay: -1 }, dsMap((value: number) => value)), RangeError);

        let attempts = 0;
        const source = new DataSource<number>();
        const output = source.transform(
            dsRetry({ retryCount: 2 }, dsMap(() => {
                attempts++;
                throw new Error(`attempt ${attempts}`);
            }))
        );
        const error = new Promise<Error>((resolve) => output.onError(resolve));
        source.update(1);
        assert.equal((await error).message, 'attempt 3');
        assert.equal(attempts, 3);
    });

    it('waits between retries and stops during the cancellable delay', async () => {
        vi.useFakeTimers();
        const token = new CancellationToken();
        const source = new DataSource<number>();
        let attempts = 0;
        const output = source.transform(
            dsRetry({ retryCount: 2, retryDelay: 20 }, dsMap(() => {
                attempts++;
                throw new Error('retry');
            })),
            token
        );
        const values: number[] = [];
        output.listen((value) => values.push(value));
        source.update(1);
        await Promise.resolve();
        assert.equal(attempts, 1);
        token.cancel();
        await vi.runAllTimersAsync();
        assert.equal(attempts, 1);
        assert.deepEqual(values, []);
    });
});
