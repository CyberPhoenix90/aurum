import { afterEach, assert, describe, it, vi } from 'vitest';
import {
    CancellationToken,
    DataFlow,
    DataFlowBoth,
    DataSource,
    DuplexDataSource,
    ddsDebounce,
    ddsFilter,
    ddsMap,
    ddsOneWayFlow,
    ddsUnique
} from '../src/index.js';

const turn = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('DuplexDataSource', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('keeps downstream publications and upstream writes directionally observable', () => {
        const root = new DuplexDataSource(1);
        const downstream: number[] = [];
        const upstream: number[] = [];
        root.listenDownstream((value) => downstream.push(value));
        root.listenUpstream((value) => upstream.push(value));

        root.updateDownstream(2);
        root.updateUpstream(3);
        root.publish(4);
        root.write(5);

        assert.deepEqual(downstream, [2, 3, 4, 5]);
        assert.deepEqual(upstream, [3, 5]);
        assert.equal(root.value, 5);

        const transformNode = new DuplexDataSource(1, false);
        const transformDownstream: number[] = [];
        transformNode.listen((value) => transformDownstream.push(value));
        transformNode.write(2);
        assert.deepEqual(transformDownstream, []);
        assert.equal(transformNode.value, 2);
    });

    it('supports repeat, one-time, and independent upstream cancellation', () => {
        const source = new DuplexDataSource(1, false);
        const repeated: number[] = [];
        const once: number[] = [];
        const downstream: number[] = [];
        source.listenUpstreamAndRepeat((value) => repeated.push(value));
        source.listenUpstreamOnce((value) => once.push(value));
        source.listen((value) => downstream.push(value));

        source.write(2);
        source.write(3);
        source.cancelAllUpstream();
        source.write(4);
        source.publish(5);

        assert.deepEqual(repeated, [1, 2, 3]);
        assert.deepEqual(once, [2]);
        assert.deepEqual(downstream, [5]);
        source.cancelAllDownstream();
        source.publish(6);
        assert.deepEqual(downstream, [5]);
    });

    it('rejects self writes and synchronous upstream feedback while recovering its lock', () => {
        const source = new DuplexDataSource<any>(0, false);
        assert.throws(() => source.write(source), /itself/);
        const token = new CancellationToken();
        source.listenUpstream((value) => {
            if (value === 1) source.write(2);
        }, token);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        assert.throws(() => source.write(1), /Unstable value propagation/);
        token.cancel();
        source.write(3);
        assert.equal(source.value, 3);
    });

    it('combines separate downstream and upstream data sources', () => {
        const downstream = new DataSource<number>();
        const upstream = new DataSource<number>();
        const source = DuplexDataSource.fromTwoDataSource(downstream, upstream, 0, false);
        const reads: number[] = [];
        source.listen((value) => reads.push(value));

        downstream.publish(1);
        source.write(2);

        assert.deepEqual(reads, [1]);
        assert.equal(upstream.value, 2);
        assert.equal(source.value, 2);
    });

    it('converts values, preserves duplex instances, and exposes downstream projections', () => {
        const source = new DuplexDataSource(1);
        assert.strictEqual(DuplexDataSource.toDuplexDataSource(source), source);
        assert.equal(DuplexDataSource.toDuplexDataSource(2).value, 2);

        const token = new CancellationToken();
        const projection = source.downStreamToDataSource(token);
        source.publish(3);
        token.cancel();
        source.publish(4);
        assert.equal(projection.value, 3);
    });

    it('creates duplex sources from promises and respects cancellation', async () => {
        const resolved = DuplexDataSource.fromPromise(Promise.resolve(1));
        const rejected = DuplexDataSource.fromPromise<number>(Promise.reject(new Error('no')));
        const error = new Promise<Error>((resolve) => rejected.onError(resolve));
        const token = new CancellationToken();
        const cancelled = DuplexDataSource.fromPromise(Promise.resolve(2), token);
        token.cancel();
        await Promise.resolve();

        assert.equal(resolved.value, 1);
        assert.equal((await error).message, 'no');
        assert.isUndefined(cancelled.value);
    });

    it('creates duplex sources from promise arrays and routes rejected items', async () => {
        const source = DuplexDataSource.fromPromiseArray([Promise.resolve(1), Promise.reject(new Error('bad')), Promise.resolve(2)]);
        const values: number[] = [];
        const errors: string[] = [];
        source.listen((value) => values.push(value));
        source.onError((error) => errors.push(error.message));
        await turn();

        assert.deepEqual(values, [1, 2]);
        assert.deepEqual(errors, ['bad']);
    });

    it('creates duplex sources from async iterators and routes iterator errors', async () => {
        async function* values() {
            await Promise.resolve();
            yield 1;
            throw new Error('iterator failure');
        }
        const source = DuplexDataSource.fromAsyncIterator(values());
        const received: number[] = [];
        const errors: string[] = [];
        source.listen((value) => received.push(value));
        source.onError((error) => errors.push(error.message));
        await turn();

        assert.deepEqual(received, [1]);
        assert.deepEqual(errors, ['iterator failure']);
    });

    it('maps and filters values independently in both directions', () => {
        const mappedSource = new DuplexDataSource(2, false);
        const mapped = mappedSource.transformDuplex(ddsMap((value: number) => `v${value}`, (value: string) => Number(value.slice(1))));
        const mappedDownstream: string[] = [];
        const mappedUpstream: number[] = [];
        mapped.listenAndRepeat((value) => mappedDownstream.push(value));
        mappedSource.listenUpstream((value) => mappedUpstream.push(value));
        mappedSource.publish(5);
        mapped.write('v6');
        assert.deepEqual(mappedDownstream, ['v2', 'v5']);
        assert.deepEqual(mappedUpstream, [6]);

        const filteredSource = new DuplexDataSource(2, false);
        const filtered = filteredSource.transformDuplex(ddsFilter((value) => value !== 3, (value) => value !== 4));
        const filteredDownstream: number[] = [];
        const filteredUpstream: number[] = [];
        filtered.listenAndRepeat((value) => filteredDownstream.push(value));
        filteredSource.listenUpstream((value) => filteredUpstream.push(value));
        filteredSource.publish(3);
        filteredSource.publish(5);
        filtered.write(4);
        filtered.write(6);
        assert.deepEqual(filteredDownstream, [2, 5]);
        assert.deepEqual(filteredUpstream, [6]);
    });

    it('isolates uniqueness by pipeline and selected direction', () => {
        const source = new DuplexDataSource<number>(undefined, false);
        const downstreamOnly = source.transformDuplex(ddsUnique(DataFlowBoth.DOWNSTREAM));
        const values: number[] = [];
        const upstream: number[] = [];
        downstreamOnly.listen((value) => values.push(value));
        source.listenUpstream((value) => upstream.push(value));

        source.publish(1);
        source.publish(1);
        downstreamOnly.write(2);
        downstreamOnly.write(2);

        assert.deepEqual(values, [1]);
        assert.deepEqual(upstream, [2, 2]);

        const custom = source.transformDuplex(ddsUnique(DataFlowBoth.BOTH, (a, b) => Math.abs(a) === Math.abs(b)));
        const customValues: number[] = [];
        custom.listenAndRepeat((value) => customValues.push(value));
        source.publish(3);
        source.publish(-3);
        assert.deepEqual(customValues, [2, 3]);
    });

    it('supports one-way operators and one-way source construction', () => {
        const source = new DuplexDataSource<number>(undefined, false);
        const downstream = source.transformDuplex(ddsOneWayFlow(DataFlow.DOWNSTREAM));
        const upstream = source.transformDuplex(ddsOneWayFlow(DataFlow.UPSTREAM));
        const downstreamValues: number[] = [];
        const upstreamValues: number[] = [];
        downstream.listen((value) => downstreamValues.push(value));
        upstream.listen((value) => upstreamValues.push(value));
        source.publish(1);

        assert.deepEqual(downstreamValues, [1]);
        assert.deepEqual(upstreamValues, []);

        const oneWay = DuplexDataSource.createOneWay<number>(DataFlow.DOWNSTREAM, 2);
        const reads: number[] = [];
        oneWay.listen((value) => reads.push(value));
        oneWay.write(3);
        oneWay.publish(4);
        assert.deepEqual(reads, [4]);
    });

    it('debounces configured duplex directions and disposes pending work', async () => {
        vi.useFakeTimers();
        const source = new DuplexDataSource<number>(undefined, false);
        const token = new CancellationToken();
        const both = source.transformDuplex(ddsDebounce<number>(10, DataFlowBoth.BOTH), token);
        const downstream: number[] = [];
        const upstream: number[] = [];
        both.listen((value) => downstream.push(value));
        source.listenUpstream((value) => upstream.push(value));

        source.publish(1);
        source.publish(2);
        both.write(3);
        both.write(4);
        await vi.advanceTimersByTimeAsync(10);
        assert.deepEqual(downstream, [2]);
        assert.deepEqual(upstream, [4]);

        source.publish(5);
        token.cancel();
        await vi.runAllTimersAsync();
        assert.deepEqual(downstream, [2]);
    });

    it('passes through the direction excluded from debounce', async () => {
        vi.useFakeTimers();
        const source = new DuplexDataSource<number>(undefined, false);
        const downstreamOnly = source.transformDuplex(ddsDebounce<number>(10, DataFlowBoth.DOWNSTREAM));
        const upstream: number[] = [];
        source.listenUpstream((value) => upstream.push(value));
        downstreamOnly.write(1);
        await Promise.resolve();
        assert.deepEqual(upstream, [1]);
    });

    it('pipes in both directions until cancellation', () => {
        const source = new DuplexDataSource(0, false);
        const target = new DataSource(0);
        const token = new CancellationToken();
        source.pipe(target, token);
        source.publish(1);
        target.publish(2);
        token.cancel();
        source.publish(3);
        target.publish(4);

        assert.equal(source.value, 3);
        assert.equal(target.value, 4);
    });

    it('routes errors according to direction and supports upstream recovery', () => {
        const source = new DuplexDataSource<number>(undefined, false);
        const errors: string[] = [];
        source.onError((error) => errors.push(error.message));
        source.emitError(new Error('downstream'), DataFlow.DOWNSTREAM);
        source.emitError(new Error('upstream'), DataFlow.UPSTREAM);
        assert.deepEqual(errors, ['downstream', 'upstream']);

        const recovered = new DuplexDataSource<number>(undefined, false).handleErrors(() => 42);
        const writes: number[] = [];
        recovered.listenUpstream((value) => writes.push(value));
        recovered.emitError(new Error('recover'), DataFlow.UPSTREAM);
        assert.deepEqual(writes, [42]);

        assert.throws(() => new DuplexDataSource().emitError(new Error('unhandled'), DataFlow.UPSTREAM), /unhandled/);
    });

    it('cancels every direction with cancelAll', () => {
        const source = new DuplexDataSource(0);
        const downstream = vi.fn();
        const upstream = vi.fn();
        source.listen(downstream);
        source.listenUpstream(upstream);
        source.cancelAll();
        source.publish(1);
        source.write(2);
        assert.equal(downstream.mock.calls.length, 0);
        assert.equal(upstream.mock.calls.length, 0);
    });
});
