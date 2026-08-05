import { afterEach, assert, describe, it, vi } from 'vitest';
import {
    Channel,
    DataSource,
    dsFilter,
    dsMap,
    dsPipe,
    fetchGetJsonChannel,
    fetchPostJsonChannel,
    fetchRawChannel,
    getValueOf
} from '../../src/index.js';

describe('Channel', () => {
    afterEach(() => vi.restoreAllMocks());

    it('processes different input and output types', () => {
        const channel = Channel.fromFunction((value: number) => `value:${value}`);
        const values: string[] = [];
        channel.output.listen((value) => values.push(value));
        channel.update(1);
        channel.update(2);
        assert.deepEqual(values, ['value:1', 'value:2']);
        assert.equal(channel.value, 'value:2');
        assert.equal(getValueOf(channel), 'value:2');
        assert.match(channel.name, /^IN:.* OUT:/);
    });

    it('supports asynchronous processors and routes failures to the output', async () => {
        const channel = Channel.fromFunction(async (value: number) => {
            if (value < 0) throw new Error('negative');
            return value * 2;
        });
        const errors: string[] = [];
        channel.output.onError((error) => errors.push(error.message));
        channel.update(2);
        await Promise.resolve();
        assert.equal(channel.value, 4);
        channel.update(-1);
        await Promise.resolve();
        await Promise.resolve();
        assert.deepEqual(errors, ['negative']);
    });

    it('creates reusable operator pipelines', () => {
        const channel = Channel.fromTransformation(
            dsFilter<number>((value) => value % 2 === 0),
            dsMap((value) => `v${value}`)
        );
        const values: string[] = [];
        channel.output.listen((value) => values.push(value));
        channel.update(1);
        channel.update(2);
        channel.update(4);
        assert.deepEqual(values, ['v2', 'v4']);
    });

    it('composes output transformations while retaining the original input type', () => {
        const root = Channel.fromFunction((value: number) => `n${value}`);
        const length = root.transform(dsMap((value) => value.length));
        const doubled = length.transform(dsMap((value) => value * 2));
        root.update(10);
        assert.equal(length.value, 3);
        assert.equal(doubled.value, 6);
        doubled.update(100);
        assert.equal(root.value, 'n100');
        assert.equal(doubled.value, 8);
    });

    it('disposes a derived channel without affecting its parent or siblings', () => {
        const root = Channel.fromFunction((value: number) => value);
        const first = root.transform(dsMap((value) => value + 1));
        const second = root.transform(dsMap((value) => value + 2));
        root.update(1);
        first.dispose();
        root.update(2);
        assert.equal(root.value, 2);
        assert.equal(first.value, 2);
        assert.equal(second.value, 4);
        assert.isTrue(first.isDisposed);
        assert.isFalse(root.isDisposed);
    });

    it('disposes owned processing and all descendants without cancelling external sources', () => {
        const input = new DataSource<number>();
        const output = new DataSource<string>();
        const external = Channel.fromSources(input, output);
        const derived = external.transform(dsMap((value) => value.length));
        output.update('one');
        assert.equal(derived.value, 3);
        external.dispose();
        assert.isTrue(derived.isDisposed);
        output.update('three');
        assert.equal(output.value, 'three');
        assert.equal(derived.value, 3);
        assert.throws(() => external.transform(dsMap((value) => value.length)), /disposed channel/);
    });

    it('ignores writes and pending asynchronous results after disposal', async () => {
        let resolve!: (value: number) => void;
        const channel = Channel.fromFunction(() => new Promise<number>((done) => (resolve = done)));
        channel.update(1);
        channel.dispose();
        resolve(2);
        await Promise.resolve();
        channel.update(3);
        assert.isUndefined(channel.value);
    });

    it('remains a valid target for data-source operators', () => {
        const source = new DataSource<number>();
        const channel = Channel.fromFunction((value: number) => value * 2);
        source.transform(dsPipe(channel));
        source.update(3);
        assert.equal(channel.value, 6);
    });

    it('creates a raw fetch channel', async () => {
        const response = new Response('ok');
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
        const channel = fetchRawChannel('/raw');
        const result = channel.output.awaitNextUpdate();
        channel.update({ headers: { Accept: 'text/plain' } });
        assert.strictEqual(await result, response);
        assert.deepEqual(fetchMock.mock.calls, [['/raw', { headers: { Accept: 'text/plain' } }]]);
    });

    it('creates JSON GET and POST channels with request configuration', async () => {
        const fetchMock = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(new Response('{"result":"get"}', { headers: { 'Content-Type': 'application/json' } }))
            .mockResolvedValueOnce(new Response('{"result":"post"}', { headers: { 'Content-Type': 'application/json' } }));
        const get = fetchGetJsonChannel<{ result: string }>('/get', { credentials: 'include' });
        const post = fetchPostJsonChannel<{ query: string }, { result: string }>('/post', {
            credentials: 'same-origin',
            headers: { Authorization: 'token' }
        });
        const getResult = get.output.awaitNextUpdate();
        const postResult = post.output.awaitNextUpdate();
        get.update();
        post.update({ query: 'aurum' });

        assert.deepEqual(await getResult, { result: 'get' });
        assert.deepEqual(await postResult, { result: 'post' });
        assert.deepEqual(fetchMock.mock.calls[0], ['/get', { credentials: 'include' }]);
        assert.deepEqual(fetchMock.mock.calls[1], [
            '/post',
            {
                credentials: 'same-origin',
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'token' },
                body: '{"query":"aurum"}'
            }
        ]);
    });
});
