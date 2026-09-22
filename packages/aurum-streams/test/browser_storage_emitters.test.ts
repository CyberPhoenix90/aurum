import { afterAll, afterEach, assert, beforeAll, beforeEach, describe, it, vi } from 'vitest';
import {
    ArrayDataSource,
    CancellationToken,
    Channel,
    DataSource,
    ObjectDataSource,
    UrlStorage,
    animate,
    intervalEmitter,
    tweenEmitter,
    urlHashEmitter,
    urlPathEmitter,
    windowSizeEmitter
} from '../src/index.js';

class BrowserWindow extends EventTarget {
    public innerWidth = 1024;
    public innerHeight = 768;
}

let currentUrl: URL;
let browserWindow: BrowserWindow;
let replaceCalls: Array<[any, string, string | URL | undefined]>;
let pushCalls: Array<[any, string, string | URL | undefined]>;

const setUrl = (url: string | URL | undefined) => {
    if (url !== undefined) currentUrl = new URL(String(url), currentUrl);
};

const baseReplaceState = (data: any, unused: string, url?: string | URL) => {
    replaceCalls.push([data, unused, url]);
    setUrl(url);
};

const basePushState = (data: any, unused: string, url?: string | URL) => {
    pushCalls.push([data, unused, url]);
    setUrl(url);
};

describe('URL-backed storage and browser emitters', () => {
    beforeAll(() => {
        currentUrl = new URL('https://example.test/');
        browserWindow = new BrowserWindow();
        replaceCalls = [];
        pushCalls = [];
        vi.stubGlobal('window', browserWindow);
        vi.stubGlobal('location', {
            get href() {
                return currentUrl.href;
            },
            get pathname() {
                return currentUrl.pathname;
            },
            get search() {
                return currentUrl.search;
            },
            get hash() {
                return currentUrl.hash;
            }
        });
        vi.stubGlobal('history', {
            replaceState: baseReplaceState,
            pushState: basePushState
        });
    });

    beforeEach(() => {
        replaceCalls.length = 0;
        pushCalls.length = 0;
        currentUrl = new URL('https://example.test/');
        browserWindow.innerWidth = 1024;
        browserWindow.innerHeight = 768;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    afterAll(() => {
        vi.unstubAllGlobals();
    });

    it('implements Storage reads, ordering, writes, removals, and clearing', () => {
        currentUrl = new URL('https://example.test/path?first=1&second=two#fragment');
        const storage = new UrlStorage();
        assert.equal(storage.length, 2);
        assert.equal(storage.key(0), 'first');
        assert.equal(storage.key(1), 'second');
        assert.isUndefined(storage.key(2));
        assert.equal(storage.getItem('second'), 'two');

        storage.setItem('third', 'space value');
        assert.equal(currentUrl.pathname, '/path');
        assert.equal(currentUrl.hash, '#fragment');
        assert.equal(currentUrl.searchParams.get('third'), 'space value');
        storage.removeItem('first');
        assert.isNull(currentUrl.searchParams.get('first'));
        storage.clear();
        assert.equal(storage.length, 0);
        assert.equal(currentUrl.search, '');
    });

    it('refreshes state after otherwise unobservable URL changes', () => {
        const storage = new UrlStorage();
        baseReplaceState({}, '', '/next?a=1&b=2');
        assert.isUndefined(storage.getItem('a'));
        storage.refresh();
        assert.equal(storage.getItem('a'), '1');
        assert.equal(storage.getItem('b'), '2');

        baseReplaceState({}, '', '/next?b=3');
        storage.refresh();
        assert.isUndefined(storage.getItem('a'));
        assert.equal(storage.getItem('b'), '3');
    });

    it('observes replaceState and pushState path changes with burst coalescing', async () => {
        const paths: string[] = [];
        const token = new CancellationToken();
        urlPathEmitter((path) => paths.push(path), token);

        history.replaceState({}, '', '/one');
        history.pushState({}, '', '/two');
        assert.deepEqual(paths, ['/one']);
        await Promise.resolve();
        assert.deepEqual(paths, ['/one', '/two']);

        browserWindow.dispatchEvent(new Event('popstate'));
        assert.deepEqual(paths, ['/one', '/two', '/two']);
        token.cancel();
        history.replaceState({}, '', '/ignored');
        assert.deepEqual(paths, ['/one', '/two', '/two']);
    });

    it('updates UrlStorage state through observed history changes', async () => {
        const storage = new UrlStorage();
        history.replaceState({}, '', '/search?q=aurum');
        await Promise.resolve();
        assert.equal(storage.getItem('q'), 'aurum');
        history.replaceState({}, '', '/search');
        await Promise.resolve();
        assert.isUndefined(storage.getItem('q'));
    });

    it('emits full and stripped hashes immediately and on hashchange', () => {
        currentUrl = new URL('https://example.test/#section?query=1');
        const full = new DataSource<string>();
        const stripped = new ArrayDataSource<string>();
        const token = new CancellationToken();
        urlHashEmitter(full, false, token);
        urlHashEmitter(stripped, true, token);
        assert.equal(full.value, '#section?query=1');
        assert.deepEqual(stripped.toArray(), ['section']);

        currentUrl = new URL('https://example.test/#next#nested');
        browserWindow.dispatchEvent(new Event('hashchange'));
        assert.equal(full.value, '#next#nested');
        assert.deepEqual(stripped.toArray(), ['section', 'next']);
        token.cancel();
        currentUrl = new URL('https://example.test/#ignored');
        browserWindow.dispatchEvent(new Event('hashchange'));
        assert.equal(full.value, '#next#nested');
    });

    it('updates scalar, collection, and channel targets at intervals until cancelled', async () => {
        vi.useFakeTimers();
        const scalar = new DataSource<number>();
        const array = new ArrayDataSource<number>();
        const channel = Channel.fromFunction((value: number) => value * 2);
        const token = new CancellationToken();
        intervalEmitter(scalar, 5, 1, token);
        intervalEmitter(array, 5, 2, token);
        intervalEmitter(channel, 5, 3, token);

        await vi.advanceTimersByTimeAsync(10);
        assert.equal(scalar.value, 1);
        assert.deepEqual(array.toArray(), [2, 2]);
        assert.equal(channel.value, 6);
        token.cancel();
        await vi.advanceTimersByTimeAsync(10);
        assert.deepEqual(array.toArray(), [2, 2]);
    });

    it('streams the initial and debounced browser size until cancelled', async () => {
        vi.useFakeTimers();
        const size = new ObjectDataSource({ width: 0, height: 0 });
        const token = new CancellationToken();
        windowSizeEmitter(size, 10, token);
        assert.deepEqual(size.toObject(), { width: 1024, height: 768 });

        browserWindow.innerWidth = 1280;
        browserWindow.innerHeight = 720;
        browserWindow.dispatchEvent(new Event('resize'));
        assert.deepEqual(size.toObject(), { width: 1024, height: 768 });
        await vi.advanceTimersByTimeAsync(10);
        assert.deepEqual(size.toObject(), { width: 1280, height: 720 });

        token.cancel();
        browserWindow.innerWidth = 800;
        browserWindow.dispatchEvent(new Event('resize'));
        await vi.advanceTimersByTimeAsync(10);
        assert.deepEqual(size.toObject(), { width: 1280, height: 720 });
    });
});

describe('animation emitters', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('animates progress and tweens interpolated values to completion', async () => {
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            frames.push(callback);
            return frames.length;
        });
        let now = 0;
        vi.spyOn(Date, 'now').mockImplementation(() => now);
        const progress: number[] = [];
        const animation = animate((value) => progress.push(value), 100, new CancellationToken());
        now = 50;
        frames.shift()?.(50);
        now = 100;
        frames.shift()?.(100);
        await animation;
        assert.deepEqual(progress, [0.5, 1]);

        const target = new DataSource<number>();
        const values: number[] = [];
        target.listen((value) => values.push(value));
        const tween = tweenEmitter(target, 100, 0, 10, (value) => value * value, new CancellationToken());
        now = 150;
        frames.shift()?.(150);
        now = 200;
        frames.shift()?.(200);
        await tween;
        assert.deepEqual(values, [2.5, 10]);
    });

    it('resolves animation when its parent lifetime is cancelled', async () => {
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            frames.push(callback);
            return frames.length;
        });
        const token = new CancellationToken();
        const callback = vi.fn();
        const animation = animate(callback, 100, token);
        token.cancel();
        await animation;
        frames.shift()?.(0);
        assert.equal(callback.mock.calls.length, 0);
    });

    it('uses a simple delay when a scalar tween has no distance', async () => {
        vi.useFakeTimers();
        const target = new DataSource(5);
        const tween = tweenEmitter(target, 20, 5, 5);
        let completed = false;
        tween.then(() => (completed = true));
        await vi.advanceTimersByTimeAsync(19);
        assert.isFalse(completed);
        await vi.advanceTimersByTimeAsync(1);
        assert.isTrue(completed);
        assert.equal(target.value, 5);
    });
});
