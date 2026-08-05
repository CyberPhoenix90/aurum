import { afterEach, assert, describe, it, vi } from 'vitest';
import {
    ArrayDataSource,
    CancellationToken,
    DataSource,
    DuplexDataSource,
    dsAccumulate,
    dsAwait,
    dsAwaitLatest,
    dsAwaitOrdered,
    dsBuffer,
    dsCutOff,
    dsCutOffDynamic,
    dsDebounce,
    dsDelay,
    dsDiff,
    dsEven,
    dsFilterAsync,
    dsFork,
    dsHistory,
    dsLoadBalance,
    dsLog,
    dsMap,
    dsMapAsync,
    dsMax,
    dsMicroDebounce,
    dsMin,
    dsOdd,
    dsPick,
    dsPipe,
    dsPipeAll,
    dsPipeUp,
    dsReduce,
    dsSemaphore,
    dsSkip,
    dsSkipDynamic,
    dsSpread,
    dsStringJoin,
    dsTap,
    dsThrottle,
    dsThrottleBuffer,
    dsThrottleFrame,
    dsThroughputMeter,
    dsUnique,
    dsUpdateToken
} from '../../src/aurumjs.js';

const turn = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('DataSource transformation operators', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('composes synchronous and asynchronous maps and filters', async () => {
        const source = new DataSource<number>();
        const output = source.transform(
            dsMap((value) => value + 1),
            dsFilterAsync(async (value) => value % 2 === 0),
            dsMapAsync(async (value) => `v${value}`)
        );
        const values: string[] = [];
        output.listen((value) => values.push(value));

        source.update(1);
        source.update(2);
        source.update(3);
        await turn();
        assert.deepEqual(values, ['v2', 'v4']);
    });

    it('tracks differences and cancels the previous update lifetime', () => {
        const source = new DataSource<number>();
        const differences = source.transform(dsDiff<number>());
        const lifetimes = source.transform(dsUpdateToken<number>());
        const cancelled: number[] = [];
        lifetimes.listen(({ value, token }) => token.addCancellable(() => cancelled.push(value)));

        source.update(1);
        source.update(2);
        source.update(3);

        assert.deepEqual(differences.value, { oldValue: 2, newValue: 3 });
        assert.deepEqual(cancelled, [1, 2]);
        assert.equal(lifetimes.value.value, 3);
        assert.isFalse(lifetimes.value.token.isCancelled);
    });

    it('supports numeric parity and record filters', () => {
        const source = new DataSource<number>();
        const even: number[] = [];
        const odd: number[] = [];
        const minima: number[] = [];
        const maxima: number[] = [];
        source.transform(dsEven()).listen((value) => even.push(value));
        source.transform(dsOdd()).listen((value) => odd.push(value));
        source.transform(dsMin()).listen((value) => minima.push(value));
        source.transform(dsMax()).listen((value) => maxima.push(value));

        [3, 2, 4, 1, 1, 5].forEach((value) => source.update(value));
        assert.deepEqual(even, [2, 4]);
        assert.deepEqual(odd, [3, 1, 1, 5]);
        assert.deepEqual(minima, [3, 2, 1]);
        assert.deepEqual(maxima, [3, 4, 5]);
    });

    it('accepts the first minimum and maximum even outside safe-integer bounds', () => {
        const source = new DataSource<number>();
        const minima: number[] = [];
        const maxima: number[] = [];
        source.transform(dsMin()).listen((value) => minima.push(value));
        source.transform(dsMax()).listen((value) => maxima.push(value));
        source.update(Infinity);
        source.update(-Infinity);
        assert.deepEqual(minima, [Infinity, -Infinity]);
        assert.deepEqual(maxima, [Infinity]);
    });

    it('supports fixed and externally controlled skip and cutoff filters', () => {
        const source = new DataSource<number>();
        const skipCount = new DataSource(2);
        const cutoffCount = new DataSource(2);
        const skipped: number[] = [];
        const dynamicallySkipped: number[] = [];
        const cutOff: number[] = [];
        const dynamicallyCutOff: number[] = [];
        source.transform(dsSkip(2)).listen((value) => skipped.push(value));
        source.transform(dsSkipDynamic(skipCount)).listen((value) => dynamicallySkipped.push(value));
        source.transform(dsCutOff(2)).listen((value) => cutOff.push(value));
        source.transform(dsCutOffDynamic(cutoffCount)).listen((value) => dynamicallyCutOff.push(value));

        [1, 2, 3].forEach((value) => source.update(value));
        cutoffCount.update(1);
        skipCount.update(1);
        source.update(4);
        source.update(5);

        assert.deepEqual(skipped, [3, 4, 5]);
        assert.deepEqual(dynamicallySkipped, [3, 5]);
        assert.deepEqual(cutOff, [1, 2]);
        assert.deepEqual(dynamicallyCutOff, [1, 2, 4]);
    });

    it('filters duplicate primitives, NaN values, and custom-equivalent objects', () => {
        const primitives = new DataSource<number>();
        const primitiveValues: number[] = [];
        primitives.transform(dsUnique()).listen((value) => primitiveValues.push(value));
        [1, 1, NaN, NaN, 2].forEach((value) => primitives.update(value));
        assert.equal(primitiveValues.length, 3);
        assert.equal(primitiveValues[0], 1);
        assert.isNaN(primitiveValues[1]);
        assert.equal(primitiveValues[2], 2);

        const objects = new DataSource<{ id: number }>();
        const ids: number[] = [];
        objects.transform(dsUnique((a, b) => a.id === b.id)).listen((value) => ids.push(value.id));
        objects.update({ id: 1 });
        objects.update({ id: 1 });
        objects.update({ id: 2 });
        assert.deepEqual(ids, [1, 2]);
    });

    it('awaits promises in completion order', async () => {
        const source = new DataSource<Promise<number>>();
        const values: number[] = [];
        source.transform(dsAwait()).listen((value) => values.push(value));
        let first!: (value: number) => void;
        let second!: (value: number) => void;
        source.update(new Promise((resolve) => (first = resolve)));
        source.update(new Promise((resolve) => (second = resolve)));
        second(2);
        await turn();
        first(1);
        await turn();
        assert.deepEqual(values, [2, 1]);
    });

    it('awaits promises in input order when ordered', async () => {
        const source = new DataSource<Promise<number>>();
        const values: number[] = [];
        source.transform(dsAwaitOrdered()).listen((value) => values.push(value));
        let first!: (value: number) => void;
        let second!: (value: number) => void;
        source.update(new Promise((resolve) => (first = resolve)));
        source.update(new Promise((resolve) => (second = resolve)));
        second(2);
        await turn();
        assert.deepEqual(values, []);
        first(1);
        await turn();
        await turn();
        assert.deepEqual(values, [1, 2]);
    });

    it('only emits the latest pending promise result', async () => {
        const source = new DataSource<Promise<number>>();
        const values: number[] = [];
        source.transform(dsAwaitLatest()).listen((value) => values.push(value));
        let first!: (value: number) => void;
        let second!: (value: number) => void;
        source.update(new Promise((resolve) => (first = resolve)));
        source.update(new Promise((resolve) => (second = resolve)));
        first(1);
        await turn();
        second(2);
        await turn();
        assert.deepEqual(values, [2]);
    });

    it('reduces, accumulates, and joins update histories', () => {
        const numbers = new DataSource<number>();
        const total = numbers.transform(dsReduce((sum, value) => sum + value, 10));
        const accumulated = numbers.transform(dsAccumulate(5));
        numbers.update(1);
        numbers.update(2);
        assert.equal(total.value, 13);
        assert.equal(accumulated.value, 8);

        const strings = new DataSource<string>();
        const joined = strings.transform(dsStringJoin('|'));
        strings.update('a');
        strings.update('b');
        strings.update('c');
        assert.equal(joined.value, 'a|b|c');

        const emptyFirst = new DataSource<string>();
        const emptyJoined = emptyFirst.transform(dsStringJoin('|'));
        emptyFirst.update('');
        emptyFirst.update('a');
        assert.equal(emptyJoined.value, '|a');
    });

    it('delays updates and debounces to the latest value', async () => {
        vi.useFakeTimers();
        const source = new DataSource<number>();
        const delayed: number[] = [];
        const debounced: number[] = [];
        source.transform(dsDelay(10)).listen((value) => delayed.push(value));
        source.transform(dsDebounce(10)).listen((value) => debounced.push(value));
        source.update(1);
        source.update(2);
        await vi.advanceTimersByTimeAsync(10);
        assert.deepEqual(delayed, [1, 2]);
        assert.deepEqual(debounced, [2]);
    });

    it('micro-debounces and frame-debounces bursts', async () => {
        vi.useFakeTimers();
        const source = new DataSource<number>();
        const micro: number[] = [];
        const frame: number[] = [];
        source.transform(dsMicroDebounce()).listen((value) => micro.push(value));
        source.transform(dsThrottleFrame()).listen((value) => frame.push(value));
        source.update(1);
        source.update(2);
        await vi.runAllTimersAsync();
        assert.deepEqual(micro, [1]);
        assert.deepEqual(frame, [2]);
    });

    it('blocks on a semaphore and consumes permits in arrival order', async () => {
        const permits = new DataSource(1);
        const source = new DataSource<number>();
        const values: number[] = [];
        source.transform(dsSemaphore(permits)).listen((value) => values.push(value));
        source.update(1);
        source.update(2);
        await turn();
        assert.deepEqual(values, [1]);
        permits.update(1);
        await turn();
        assert.deepEqual(values, [1, 2]);
        assert.equal(permits.value, 0);
    });

    it('throttles immediate updates', () => {
        vi.spyOn(performance, 'now').mockReturnValueOnce(100).mockReturnValueOnce(100).mockReturnValueOnce(105).mockReturnValueOnce(120).mockReturnValueOnce(120);
        const source = new DataSource<number>();
        const values: number[] = [];
        source.transform(dsThrottle(10)).listen((value) => values.push(value));
        source.update(1);
        source.update(2);
        source.update(3);
        assert.deepEqual(values, [1, 3]);
    });

    it('buffers throttled updates and enforces the high-water and maximum sizes', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(100);
        const highWater = vi.fn();
        const source = new DataSource<number>();
        const values: number[] = [];
        source
            .transform(dsThrottleBuffer(10, { highWaterMark: 2, maxBufferSize: 2, onHighWaterMark: highWater }))
            .listen((value) => values.push(value));
        source.update(1);
        source.update(2);
        source.update(3);
        source.update(4);
        await vi.advanceTimersByTimeAsync(25);
        assert.deepEqual(values, [1, 2]);
        assert.equal(highWater.mock.calls.length, 1);
    });

    it('spreads arrays through the remaining pipeline', async () => {
        const source = new DataSource<number[]>();
        const values: number[] = [];
        source.transform(dsSpread<number>() as any, dsMap<number, number>((value) => value * 2) as any).listen((value) => values.push(value as number));
        source.update([1, 2, 3]);
        await turn();
        assert.deepEqual(values, [2, 4, 6]);
    });

    it('buffers by batch size and by custom boundary', async () => {
        const sized = new DataSource<number>();
        const sizedBatches: number[][] = [];
        sized.transform(dsBuffer({ maxBatchSize: 2 })).listen((value) => sizedBatches.push(value));
        sized.update(1);
        sized.update(2);
        sized.update(3);
        sized.update(4);
        await turn();
        assert.deepEqual(sizedBatches, [[1, 2], [3, 4]]);

        const bounded = new DataSource<number>();
        const boundedBatches: number[][] = [];
        bounded.transform(dsBuffer({ canBatch: (item, batch) => item - batch[0] < 2 })).listen((value) => boundedBatches.push(value));
        bounded.update(1);
        bounded.update(2);
        bounded.update(4);
        bounded.update(5);
        bounded.update(7);
        await turn();
        assert.deepEqual(boundedBatches, [[1, 2], [4, 5]]);
    });

    it('buffers by time and validates that a flush condition exists', async () => {
        vi.useFakeTimers();
        assert.throws(() => dsBuffer(undefined as any), /At least one/);
        assert.throws(() => dsBuffer({}), /At least one/);
        const source = new DataSource<number>();
        const batches: number[][] = [];
        source.transform(dsBuffer({ time: 10 })).listen((value) => batches.push(value));
        source.update(1);
        source.update(2);
        await vi.advanceTimersByTimeAsync(10);
        assert.deepEqual(batches, [[1, 2]]);
    });

    it('picks properties while preserving nullish values', () => {
        const source = new DataSource<{ value: number } | null>();
        const output = source.transform(dsPick('value'));
        const values: Array<number | null> = [];
        output.listen((value) => values.push(value));
        source.update({ value: 3 });
        source.update(null);
        assert.deepEqual(values, [3, null]);
    });

    it('forks, taps, pipes, and broadcasts without changing the main value', () => {
        const source = new DataSource<number>();
        const truthy = new DataSource<number>();
        const falsy = new DataSource<number>();
        const targetA = new DataSource<number>();
        const targetB = new DataSource<number>();
        const tapped: number[] = [];
        const output = source.transform(
            dsFork((value) => value > 0, truthy, falsy),
            dsTap((value) => tapped.push(value)),
            dsPipe(targetA),
            dsPipeAll(targetB)
        );
        source.update(1);
        source.update(-1);
        assert.equal(truthy.value, 1);
        assert.equal(falsy.value, -1);
        assert.deepEqual(tapped, [1, -1]);
        assert.equal(targetA.value, -1);
        assert.equal(targetB.value, -1);
        assert.equal(output.value, -1);
    });

    it('load-balances updates in round-robin order', () => {
        const source = new DataSource<number>();
        const a = new DataSource<number>();
        const b = new DataSource<number>();
        source.transform(dsLoadBalance([a, b]));
        source.update(1);
        source.update(2);
        source.update(3);
        assert.equal(a.value, 3);
        assert.equal(b.value, 2);
    });

    it('pipes downstream and upstream into duplex targets', () => {
        const source = new DataSource<number>();
        const downstreamTarget = new DuplexDataSource<number>();
        const upstreamTarget = new DuplexDataSource<number>();
        const downstream: number[] = [];
        const upstream: number[] = [];
        downstreamTarget.listenDownstream((value) => downstream.push(value));
        upstreamTarget.listenUpstream((value) => upstream.push(value));
        source.transform(dsPipe(downstreamTarget), dsPipeUp(upstreamTarget));
        source.update(3);
        assert.deepEqual(downstream, [3]);
        assert.deepEqual(upstream, [3]);
    });

    it('records bounded history and stops recording when cancelled', () => {
        const source = new DataSource<number>();
        const history = new ArrayDataSource<number>();
        const token = new CancellationToken();
        source.transform(dsHistory(history, 2, token));
        source.update(1);
        source.update(2);
        source.update(3);
        assert.deepEqual(history.toArray(), [2, 3]);
        token.cancel();
        source.update(4);
        assert.deepEqual(history.toArray(), [2, 3]);
    });

    it('reports throughput per interval and stops with cancellation', async () => {
        vi.useFakeTimers();
        const source = new DataSource<number>();
        const report = new DataSource(0);
        const token = new CancellationToken();
        source.transform(dsThroughputMeter(report, 10, token));
        source.update(1);
        source.update(2);
        await vi.advanceTimersByTimeAsync(10);
        assert.equal(report.value, 2);
        await vi.advanceTimersByTimeAsync(10);
        assert.equal(report.value, 0);
        token.cancel();
        source.update(3);
        await vi.advanceTimersByTimeAsync(10);
        assert.equal(report.value, 0);
    });

    it('logs formatted values and still forwards them', () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        const source = new DataSource<number>();
        const output = source.transform(dsLog('value=', '!'));
        source.update(2);
        assert.deepEqual(log.mock.calls, [['value=2!']]);
        assert.equal(output.value, 2);
    });

    it('combines static sources and rejects an empty combination', () => {
        const first = new DataSource(1);
        const second = new DataSource(2);
        const combined = DataSource.fromCombination([first, second]);
        assert.equal(combined.value, 2);
        first.update(3);
        assert.equal(combined.value, 3);
        second.update(4);
        assert.equal(combined.value, 4);
        assert.throws(() => DataSource.fromCombination([]), /zero data sources/);
    });

    it('dynamically aggregates added, updated, replaced, and removed sources', () => {
        const first = new DataSource(1);
        const second = new DataSource(2);
        const sources = new ArrayDataSource<DataSource<number>>([first, second]);
        const total = DataSource.fromDynamicAggregation(sources, (values) => values.reduce((sum, value) => sum + value, 0));
        assert.equal(total.value, 3);
        first.update(3);
        assert.equal(total.value, 5);
        const third = new DataSource(4);
        sources.push(third);
        assert.equal(total.value, 9);
        sources.remove(second);
        assert.equal(total.value, 7);
        second.update(20);
        assert.equal(total.value, 7);
    });

    it('dynamically aggregates repeated source instances until their last removal', () => {
        const shared = new DataSource(2);
        const sources = new ArrayDataSource([shared, shared]);
        const total = DataSource.fromDynamicAggregation(sources, (values) => values.reduce((sum, value) => sum + value, 0));
        assert.equal(total.value, 4);
        shared.update(3);
        assert.equal(total.value, 6);
        sources.removeAt(0);
        shared.update(4);
        assert.equal(total.value, 4);
        sources.clear();
        shared.update(5);
        assert.equal(total.value, 0);
    });
});
