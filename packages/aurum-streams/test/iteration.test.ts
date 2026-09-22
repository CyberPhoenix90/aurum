import { assert, describe, expect, it } from 'vitest';
import {
    CancellationToken,
    DataSourceMapDelayFilterOperator,
    OperationType,
    dsAwaitLatest,
    dsFilter,
    dsFilterAsync,
    dsMap,
    dsMapAsync,
    dsTap,
    promiseIterator,
    readableStreamBinaryIterator,
    readableStreamStringIterator,
    transformAsyncIterator
} from '../src/index.js';

async function collect<T>(iterator: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const item of iterator) result.push(item);
    return result;
}

describe('iterator utilities', () => {
    it('runs synchronous and asynchronous map and filter operator kinds', async () => {
        function* values() {
            yield 1;
            yield 2;
            yield 3;
        }
        const output = transformAsyncIterator(
            values(),
            dsMap((value) => value + 1),
            dsFilter((value) => value !== 3),
            dsMapAsync(async (value) => value * 2),
            dsFilterAsync(async (value) => value > 2)
        );
        assert.deepEqual(await collect(output), [4, 8]);
    });

    it('handles map-delay-filter operators that keep and cancel values', async () => {
        function* promises() {
            yield Promise.resolve(1);
            yield Promise.resolve(2);
        }
        assert.deepEqual(await collect(transformAsyncIterator(promises(), dsAwaitLatest())), [1, 2]);

        const cancellingOperator: DataSourceMapDelayFilterOperator<Promise<number>, number> = {
            name: 'cancel item',
            operationType: OperationType.MAP_DELAY_FILTER,
            operation: async () => ({ cancelled: true, item: 1 })
        };
        function* onePromise() {
            yield Promise.resolve(1);
        }
        assert.deepEqual(await collect(transformAsyncIterator(onePromise(), cancellingOperator)), []);
    });

    it('stops before yielding when its supplied lifetime is cancelled', async () => {
        const token = new CancellationToken();
        function* values() {
            yield 1;
            yield 2;
        }
        const output = transformAsyncIterator(
            values(),
            dsTap(() => token.cancel()),
            dsMap((value) => value * 2),
            token
        );
        assert.deepEqual(await collect(output), []);
    });

    it('propagates operator failures to the iterator consumer', async () => {
        function* values() {
            yield 1;
        }
        const output = transformAsyncIterator(
            values(),
            dsMap(() => {
                throw new Error('mapping failed');
            })
        );
        await expect(collect(output)).rejects.toThrow('mapping failed');
    });

    it('iterates binary streams and calls completion once', async () => {
        const done: string[] = [];
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new Uint8Array([1, 2]));
                controller.enqueue(new Uint8Array([3]));
                controller.close();
            }
        });
        const chunks = await collect(readableStreamBinaryIterator(stream.getReader(), () => done.push('done')));
        assert.deepEqual(chunks.map((chunk) => Array.from(chunk)), [[1, 2], [3]]);
        assert.deepEqual(done, ['done']);
    });

    it('decodes delimited text across chunk boundaries and flushes the tail', async () => {
        const encoder = new TextEncoder();
        let completed = 0;
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(encoder.encode('one|tw'));
                controller.enqueue(encoder.encode('o|three'));
                controller.close();
            }
        });
        const values = await collect(readableStreamStringIterator(stream.getReader(), '|', () => completed++));
        assert.deepEqual(values, ['one', 'two', 'three']);
        assert.equal(completed, 1);
    });

    it('yields fulfilled and rejected promises in completion order', async () => {
        let resolveFirst!: (value: number) => void;
        let rejectSecond!: (reason: Error) => void;
        const first = new Promise<number>((resolve) => (resolveFirst = resolve));
        const second = new Promise<number>((_resolve, reject) => (rejectSecond = reject));
        const output = collect(promiseIterator([first, second]));
        rejectSecond(new Error('second'));
        resolveFirst(1);
        const values = await output;

        assert.equal(values[0].status, 'rejected');
        assert.equal((values[0] as PromiseRejectedResult).reason.message, 'second');
        assert.deepEqual(values[1], { status: 'fulfilled', value: 1 });
    });

    it('ends a promise iterator when its external token is cancelled', async () => {
        let resolve!: (value: number) => void;
        const token = new CancellationToken();
        const iterator = promiseIterator([new Promise<number>((done) => (resolve = done))], token);
        token.cancel();
        assert.deepEqual(await iterator.next(), { done: true, value: undefined });
        resolve(1);
        await Promise.resolve();
    });
});
