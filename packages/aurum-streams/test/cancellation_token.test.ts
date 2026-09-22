import { afterEach, assert, describe, it, vi } from 'vitest';
import { CancellationToken, registerAnimationLoop } from '../src/index.js';

describe('CancellationToken', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('starts active without allocating cancellation storage', () => {
        const token = new CancellationToken();
        assert.isFalse(token.isCancelled);
        assert.isFalse(token.hasCancellables());
    });

    it('runs delegates and child tokens exactly once', () => {
        const cleanup = vi.fn();
        const child = new CancellationToken();
        const token = new CancellationToken(cleanup).addCancellable(child);

        token.cancel();
        token.cancel();

        assert.equal(cleanup.mock.calls.length, 1);
        assert.isTrue(child.isCancelled);
        assert.isFalse(token.hasCancellables());
    });

    it('removes delegates and rejects mutation after cancellation', () => {
        const first = vi.fn();
        const second = vi.fn();
        const token = new CancellationToken(first, second);
        assert.strictEqual(token.removeCancellable(first), token);
        token.cancel();

        assert.equal(first.mock.calls.length, 0);
        assert.equal(second.mock.calls.length, 1);
        assert.throws(() => token.addCancellable(() => undefined), /already cancelled/);
        assert.throws(() => token.removeCancellable(second), /already cancelled/);
        assert.throws(() => token.throwIfCancelled('expired operation'), /expired operation/);
    });

    it('warns when a token accumulates 200 cleanup callbacks', () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        const token = new CancellationToken();
        for (let index = 0; index < 200; index++) token.addCancellable(() => undefined);
        assert.deepEqual(log.mock.calls, [['potential memory leak: cancellation token has over 200 clean up calls']]);
        token.cancel();
    });

    it('creates tokens from promises and timeouts', async () => {
        vi.useFakeTimers();
        let resolve!: () => void;
        const promiseToken = CancellationToken.fromPromise(new Promise<void>((done) => (resolve = done)));
        const timeoutToken = CancellationToken.fromTimeout(25);

        resolve();
        await Promise.resolve();
        assert.isTrue(promiseToken.isCancelled);
        assert.isFalse(timeoutToken.isCancelled);
        await vi.advanceTimersByTimeAsync(25);
        assert.isTrue(timeoutToken.isCancelled);
    });

    it('owns timeout and interval lifetimes', async () => {
        vi.useFakeTimers();
        const timeout = vi.fn();
        const interval = vi.fn();
        const token = new CancellationToken();
        token.setTimeout(timeout, 20);
        token.setInterval(interval, 5);

        await vi.advanceTimersByTimeAsync(10);
        assert.equal(interval.mock.calls.length, 2);
        token.cancel();
        await vi.advanceTimersByTimeAsync(20);
        assert.equal(timeout.mock.calls.length, 0);
        assert.equal(interval.mock.calls.length, 2);

        const completed = new CancellationToken();
        completed.setTimeout(timeout, 1);
        await vi.advanceTimersByTimeAsync(1);
        assert.equal(timeout.mock.calls.length, 1);
        assert.isFalse(completed.hasCancellables());
    });

    it('owns requestAnimationFrame callbacks and removes completed frames', () => {
        const frames = new Map<number, FrameRequestCallback>();
        const cancelled: number[] = [];
        let nextId = 1;
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            const id = nextId++;
            frames.set(id, callback);
            return id;
        });
        vi.stubGlobal('cancelAnimationFrame', (id: number) => cancelled.push(id));

        const callback = vi.fn();
        const completed = new CancellationToken();
        completed.requestAnimationFrame(callback);
        frames.get(1)?.(12);
        assert.deepEqual(callback.mock.calls, [[]]);
        assert.isFalse(completed.hasCancellables());

        const cancelledToken = new CancellationToken();
        cancelledToken.requestAnimationFrame(callback);
        cancelledToken.cancel();
        assert.deepEqual(cancelled, [2]);
    });

    it('runs and cancels shared animation-loop callbacks', () => {
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            frames.push(callback);
            return frames.length;
        });

        const token = new CancellationToken();
        const values: number[] = [];
        registerAnimationLoop((time) => values.push(time), token);
        frames.shift()?.(10);
        token.cancel();
        frames.shift()?.(20);
        assert.deepEqual(values, [10]);
    });

    it('combines tokens with OR semantics and handles permanent tokens', () => {
        const base = new CancellationToken();
        assert.strictEqual(base.or(CancellationToken.forever, undefined as any), base);

        const alreadyCancelled = new CancellationToken();
        alreadyCancelled.cancel();
        assert.strictEqual(base.or(alreadyCancelled), CancellationToken.expired);

        const first = new CancellationToken();
        const second = new CancellationToken();
        const combined = first.or(second);
        second.cancel();
        assert.isTrue(combined.isCancelled);
    });

    it('combines tokens with AND semantics and handles permanent tokens', () => {
        const base = new CancellationToken();
        const cancelled = new CancellationToken();
        cancelled.cancel();
        assert.strictEqual(base.and(cancelled), base);
        assert.strictEqual(base.and(CancellationToken.forever), CancellationToken.forever);

        const first = new CancellationToken();
        const second = new CancellationToken();
        const combined = first.and(second);
        first.cancel();
        assert.isFalse(combined.isCancelled);
        second.cancel();
        assert.isTrue(combined.isCancelled);
    });

    it('registers DOM-style and emitter-style events until cancelled', () => {
        const domListeners = new Set<(event: Event) => void>();
        const emitterListeners = new Set<(value: number) => void>();
        const dom = {
            addEventListener: (_event: string, callback: (event: Event) => void) => domListeners.add(callback),
            removeEventListener: (_event: string, callback: (event: Event) => void) => domListeners.delete(callback)
        };
        const emitter = {
            on: (_event: string, callback: (value: number) => void) => emitterListeners.add(callback),
            off: (_event: string, callback: (value: number) => void) => emitterListeners.delete(callback)
        };
        const domCallback = vi.fn();
        const emitterCallback = vi.fn();
        const token = new CancellationToken()
            .registerDomEvent(dom, 'click', domCallback)
            .registerEmitterEvent(emitter, 'value', emitterCallback);

        domListeners.forEach((callback) => callback(new Event('click')));
        emitterListeners.forEach((callback) => callback(3));
        token.cancel();

        assert.equal(domCallback.mock.calls.length, 1);
        assert.deepEqual(emitterCallback.mock.calls, [[3]]);
        assert.equal(domListeners.size, 0);
        assert.equal(emitterListeners.size, 0);
    });

    it('exposes immutable expired and forever sentinel behavior', () => {
        assert.isTrue(CancellationToken.expired.isCancelled);
        assert.isFalse(CancellationToken.forever.isCancelled);
        CancellationToken.forever.addCancellable(() => assert.fail('forever must ignore cleanup'));
        assert.isFalse(CancellationToken.forever.hasCancellables());
        assert.throws(() => CancellationToken.forever.cancel(), /Cannot cancel forever token/);
    });
});
