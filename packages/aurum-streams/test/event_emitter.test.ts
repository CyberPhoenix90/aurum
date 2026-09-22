import { afterEach, assert, describe, expect, it, vi } from 'vitest';
import { CancellationToken, EventEmitter } from '../src/index.js';

describe('EventEmitter', () => {
    afterEach(() => {
        EventEmitter.setSubscriptionLeakWarningThreshold(0);
        vi.restoreAllMocks();
    });

    it('delivers regular and one-time subscriptions and reports their count', () => {
        const emitter = new EventEmitter<string>();
        const regular = vi.fn();
        const once = vi.fn();
        emitter.subscribe(regular);
        emitter.subscribeOnce(once);

        assert.equal(emitter.subscriptions, 2);
        assert.isTrue(emitter.hasSubscriptions());
        emitter.fire('first');
        emitter.fire('second');

        assert.deepEqual(regular.mock.calls, [['first'], ['second']]);
        assert.deepEqual(once.mock.calls, [['first']]);
        assert.equal(emitter.subscriptions, 1);
    });

    it('cancels regular and one-time subscriptions through tokens', () => {
        const emitter = new EventEmitter<number>();
        const regular = vi.fn();
        const once = vi.fn();
        const token = new CancellationToken();
        emitter.subscribe(regular, token);
        emitter.subscribeOnce(once, token);
        token.cancel();
        emitter.fire(1);

        assert.equal(emitter.subscriptions, 0);
        assert.equal(regular.mock.calls.length, 0);
        assert.equal(once.mock.calls.length, 0);
    });

    it('defers additions made while firing until the next event', () => {
        const emitter = new EventEmitter<number>();
        const late = vi.fn();
        emitter.subscribe((value) => {
            if (value === 1) {
                emitter.subscribe(late);
                emitter.subscribeOnce(late);
            }
        });

        emitter.fire(1);
        assert.equal(late.mock.calls.length, 0);
        emitter.fire(2);
        emitter.fire(3);
        assert.deepEqual(late.mock.calls, [[2], [2], [3]]);
    });

    it('defers cancellation while firing without skipping the current delivery', () => {
        const emitter = new EventEmitter<number>();
        const token = new CancellationToken();
        const second = vi.fn();
        emitter.subscribe(() => token.cancel());
        emitter.subscribe(second, token);

        emitter.fire(1);
        emitter.fire(2);
        assert.deepEqual(second.mock.calls, [[1]]);
    });

    it('defers cancelAll until all current subscribers finish', () => {
        const emitter = new EventEmitter<number>();
        const calls: string[] = [];
        emitter.subscribe(() => {
            calls.push('first');
            emitter.cancelAll();
        });
        emitter.subscribe(() => calls.push('second'));

        emitter.fire(1);
        emitter.fire(2);
        assert.deepEqual(calls, ['first', 'second']);
        assert.equal(emitter.subscriptions, 0);
    });

    it('continues propagation and rethrows the last subscriber error', () => {
        const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const emitter = new EventEmitter<number>();
        const delivered = vi.fn();
        emitter.subscribe(() => {
            throw new Error('first');
        });
        emitter.subscribe(delivered);
        emitter.subscribeOnce(() => {
            throw new Error('last');
        });

        assert.throws(() => emitter.fire(1), /last/);
        assert.deepEqual(delivered.mock.calls, [[1]]);
        assert.equal(errorLog.mock.calls.length, 2);
    });

    it('observes subscription-count changes without affecting delivery', () => {
        const emitter = new EventEmitter<void>();
        const counts: number[] = [];
        const stop = emitter.observeSubscriptionCount((count) => counts.push(count));
        const token = new CancellationToken();
        emitter.subscribe(() => undefined, token);
        emitter.subscribeOnce(() => undefined);
        emitter.fire();
        token.cancel();
        stop();
        emitter.subscribe(() => undefined);

        assert.deepEqual(counts, [0, 1, 2, 1, 0]);

        const hostile = new EventEmitter<void>();
        hostile.observeSubscriptionCount(() => {
            throw new Error('diagnostics only');
        }, false);
        assert.doesNotThrow(() => hostile.subscribe(() => undefined));
    });

    it('warns independently for regular and one-time subscription leaks', () => {
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        EventEmitter.setSubscriptionLeakWarningThreshold(1);
        const emitter = new EventEmitter<void>();
        emitter.subscribe(() => undefined);
        emitter.subscribe(() => undefined);
        emitter.subscribeOnce(() => undefined);
        emitter.subscribeOnce(() => undefined);

        assert.equal(warning.mock.calls.length, 2);
        assert.match(warning.mock.calls[0][0], /2 subscriptions/);
        assert.match(warning.mock.calls[1][0], /2 one time subscriptions/);
    });

    it('adapts buffered and pending values to an async iterator', async () => {
        const emitter = new EventEmitter<number>();
        const errors = new EventEmitter<Error>();
        const token = new CancellationToken();
        const iterator = emitter.toAsyncIterator(errors, token);

        emitter.fire(1);
        assert.deepEqual(await iterator.next(), { done: false, value: 1 });
        const pending = iterator.next();
        emitter.fire(2);
        assert.deepEqual(await pending, { done: false, value: 2 });
        token.cancel();
        assert.deepEqual(await iterator.next(), { done: true, value: undefined });
        assert.strictEqual(iterator[Symbol.asyncIterator](), iterator);
    });

    it('rejects buffered and pending async-iterator reads through an error channel', async () => {
        const emitter = new EventEmitter<number>();
        const errors = new EventEmitter<Error>();
        const iterator = emitter.toAsyncIterator(errors);
        errors.fire(new Error('buffered'));
        await expect(iterator.next()).rejects.toThrow('buffered');

        const pending = iterator.next();
        errors.fire(new Error('pending'));
        await expect(pending).rejects.toThrow('pending');
        emitter.cancelAll();
        errors.cancelAll();
    });

    it('creates emitters from asynchronous iterators', async () => {
        async function* values() {
            await Promise.resolve();
            yield 1;
            yield 2;
        }
        const emitter = EventEmitter.fromAsyncIterator(values());
        const received: number[] = [];
        emitter.subscribe((value) => received.push(value));
        await new Promise((resolve) => setTimeout(resolve, 0));
        assert.deepEqual(received, [1, 2]);
    });
});
