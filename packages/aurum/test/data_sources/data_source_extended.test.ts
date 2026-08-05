import { assert, describe, it } from 'vitest';
import {
    CancellationToken,
    DataSource,
    DuplexDataSource,
    EventEmitter,
    dsFilter,
    dsMap,
    dsMapAsync,
    dsRetry,
    writeTo
} from '../../src/aurumjs.js';

describe('DataSource extended contracts', () => {
    it('exposes uniform write and publish capabilities', () => {
        const source = new DataSource(1);
        const values: number[] = [];
        source.listen((value) => values.push(value));

        source.write(2);
        source.publish(3);

        assert.deepEqual(values, [2, 3]);
        assert.equal(source.value, 3);
    });

    it('makes duplex sources substitutable for data sources while preserving direction', () => {
        const source = new DuplexDataSource(1, false);
        const downstream: number[] = [];
        const upstream: number[] = [];
        source.listen((value) => downstream.push(value));
        source.listenUpstream((value) => upstream.push(value));

        assert.instanceOf(source, DataSource);
        source.publish(2);
        source.write(3);

        assert.deepEqual(downstream, [2]);
        assert.deepEqual(upstream, [3]);
        assert.equal(source.value, 3);
    });

    it('writes to callbacks and sources through the same drain helper', () => {
        const source = new DuplexDataSource(0, false);
        const upstream: number[] = [];
        const callbacks: number[] = [];
        source.listenUpstream((value) => upstream.push(value));

        writeTo(source, 1);
        writeTo((value) => callbacks.push(value), 2);

        assert.deepEqual(upstream, [1]);
        assert.deepEqual(callbacks, [2]);
    });

    it('wraps plain values but preserves existing data sources', () => {
        const source = new DataSource(1);
        assert.strictEqual(DataSource.toDataSource(source), source);
        assert.equal(DataSource.toDataSource(2).value, 2);
    });

    it('supports update helpers and suppresses unchanged updates', () => {
        const source = new DataSource(1, 'counter');
        const values: number[] = [];
        source.listen((value) => values.push(value));

        source.updateIfChanged(1);
        source.updateWith((value) => value + 1);
        source.repeatLast();

        assert.deepEqual(values, [2, 2]);
        assert.equal(source.toString(), 'counter<2>');
    });

    it('sets an initial value only while unprimed', () => {
        const empty = new DataSource<number>();
        const initialized = new DataSource(1);
        assert.strictEqual(empty.withInitial(2), empty);
        initialized.withInitial(3);
        assert.equal(empty.value, 2);
        assert.equal(initialized.value, 1);
    });

    it('rejects self updates and synchronous feedback loops', () => {
        const source = new DataSource<any>(1);
        assert.throws(() => source.update(source), /itself/);
        source.listen((value) => {
            if (value === 2) source.update(3);
        });
        assert.throws(() => source.update(2), /Unstable value propagation/);
    });

    it('recovers its update lock after a listener throws', () => {
        const source = new DataSource(1);
        const token = new CancellationToken();
        source.listen(() => {
            throw new Error('listener failure');
        }, token);

        assert.throws(() => source.update(2), /listener failure/);
        token.cancel();
        source.update(3);
        assert.equal(source.value, 3);
    });

    it('waits for the first value only when unprimed', async () => {
        const initialized = new DataSource(1);
        const empty = new DataSource<number>();
        const pending = empty.getValueWhenAvailable();
        empty.update(2);
        assert.equal(await initialized.getValueWhenAvailable(), 1);
        assert.equal(await pending, 2);
    });

    it('maps handled errors back into ordinary values', () => {
        const source = new DataSource<number>().handleErrors(() => 42);
        const values: number[] = [];
        source.listen((value) => values.push(value));
        source.emitError(new Error('recoverable'));
        assert.deepEqual(values, [42]);
    });

    it('emits unhandled errors to subscribers and throws without one', () => {
        const source = new DataSource<number>();
        const errors: Error[] = [];
        source.onError((error) => errors.push(error));
        source.emitError(new Error('observed'));
        assert.equal(errors[0].message, 'observed');
        assert.throws(() => new DataSource().emitError(new Error('unhandled')), /unhandled/);
    });

    it('creates sources from events and callbacks and honors cancellation', () => {
        const token = new CancellationToken();
        const event = new EventEmitter<number>();
        const fromEvent = DataSource.fromEvent(event, token);
        let callbackUpdate: (value: number) => void;
        const fromCallback = DataSource.fromCallback<number>((update, receivedToken) => {
            assert.strictEqual(receivedToken, token);
            callbackUpdate = update;
        }, token);

        event.fire(1);
        callbackUpdate(2);
        token.cancel();
        event.fire(3);
        assert.equal(fromEvent.value, 1);
        assert.equal(fromCallback.value, 2);
    });

    it('creates and cancels DOM event sources', () => {
        const button = document.createElement('button');
        const token = new CancellationToken();
        const source = DataSource.fromDomEvent<MouseEvent>(button, 'click', token);
        button.dispatchEvent(new MouseEvent('click'));
        const first = source.value;
        token.cancel();
        button.dispatchEvent(new MouseEvent('click'));
        assert.instanceOf(first, MouseEvent);
        assert.strictEqual(source.value, first);
    });

    it('creates and cancels Node-style event sources', () => {
        const listeners = new Set<(value: number) => void>();
        const emitter = {
            on: (_event: string, listener: (value: number) => void) => listeners.add(listener),
            off: (_event: string, listener: (value: number) => void) => listeners.delete(listener)
        };
        const token = new CancellationToken();
        const source = DataSource.fromNodeJsEvent(emitter, 'value', token);
        listeners.forEach((listener) => listener(1));
        token.cancel();
        listeners.forEach((listener) => listener(2));
        assert.equal(source.value, 1);
        assert.equal(listeners.size, 0);
    });

    it('combines multiple event sources until cancelled', () => {
        const first = new DataSource<number>();
        const second = new DataSource<number>();
        const token = new CancellationToken();
        const combined = DataSource.fromMultipleSources([first, second], token);
        first.update(1);
        second.update(2);
        token.cancel();
        first.update(3);
        assert.equal(combined.value, 2);
        assert.include(combined.name, first.name);
    });

    it('creates sources from promises and respects pre-resolution cancellation', async () => {
        let resolve: (value: number) => void;
        const token = new CancellationToken();
        const source = DataSource.fromPromise(new Promise<number>((done) => (resolve = done)), token);
        token.cancel();
        resolve(1);
        await Promise.resolve();
        assert.isUndefined(source.value);
    });

    it('routes promise rejection through the error channel', async () => {
        const source = DataSource.fromPromise<number>(Promise.reject(new Error('rejected')));
        const error = new Promise<Error>((resolve) => source.onError(resolve));
        assert.equal((await error).message, 'rejected');
    });

    it('consumes asynchronous iterators and stops after cancellation', async () => {
        const token = new CancellationToken();
        async function* values() {
            yield 1;
            await Promise.resolve();
            yield 2;
        }
        const source = DataSource.fromAsyncIterator(values(), token);
        await source.awaitNextUpdate();
        token.cancel();
        await Promise.resolve();
        assert.equal(source.value, 1);
    });

    it('streams delimited fetch text and JSON records', async () => {
        const text = DataSource.fromFetchText(new Response('one\ntwo\n'));
        const textValues: string[] = [];
        text.listen((value) => textValues.push(value));

        const json = DataSource.fromFetchJSON<{ value: number }>(new Response('{"value":1}\ninvalid\n'), {
            itemSeperatorSequence: '\n',
            onParseError: () => ({ value: 2 })
        });
        const jsonValues: Array<{ value: number }> = [];
        json.listen((value) => jsonValues.push(value));

        await new Promise((resolve) => setTimeout(resolve, 0));
        assert.deepEqual(textValues, ['one', 'two']);
        assert.deepEqual(jsonValues, [{ value: 1 }, { value: 2 }]);
    });

    it('aggregates sources and detaches with its cancellation token', () => {
        const first = new DataSource(1);
        const second = new DataSource(2);
        const token = new CancellationToken();
        const aggregate = DataSource.fromAggregation([first, second], (a, b) => a + b, token);
        assert.equal(aggregate.value, 3);
        second.update(3);
        assert.equal(aggregate.value, 4);
        token.cancel();
        first.update(10);
        assert.equal(aggregate.value, 4);
    });

    it('cancels awaitNextUpdate and finite iterators', async () => {
        const source = new DataSource<number>();
        const token = new CancellationToken();
        const pending = source.awaitNextUpdate(token);
        token.cancel();
        await pending.then(
            () => assert.fail('Expected cancellation to reject'),
            (error) => assert.match(error.message, /Cancelled/)
        );

        const iterator = source.take(0);
        assert.deepEqual(await iterator.next(), { done: true, value: undefined });
    });

    it('retries failed inline transforms and honors shouldRetry', async () => {
        let attempts = 0;
        const retrying = dsRetry(
            { retryCount: 2 },
            dsMap<number, number>((value) => {
                attempts++;
                if (attempts < 3) throw new Error('retry');
                return value * 2;
            })
        );
        const source = new DataSource<number>();
        const result = source.transform(retrying);
        source.update(2);
        await new Promise((resolve) => setTimeout(resolve, 0));
        assert.equal(result.value, 4);
        assert.equal(attempts, 3);

        const rejected = new DataSource<number>();
        const failed = rejected.transform(
            dsRetry({ retryCount: 3, shouldRetry: () => false }, dsMapAsync(async () => Promise.reject(new Error('stop'))))
        );
        const error = new Promise<Error>((resolve) => failed.onError(resolve));
        rejected.update(1);
        assert.equal((await error).message, 'stop');
    });

    it('propagates transform filtering and cancellation', () => {
        const source = new DataSource(1);
        const token = new CancellationToken();
        const result = source.transform(dsFilter((value) => value % 2 === 0), dsMap((value) => value * 10), token);
        source.update(2);
        token.cancel();
        source.update(4);
        assert.equal(result.value, 20);
    });
});
