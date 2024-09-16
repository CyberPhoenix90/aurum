// event_emitter.test.ts
import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../src/utilities/event_emitter.js';
import { CancellationToken } from '../src/aurumjs.js';

describe('EventEmitter', () => {
    it('should subscribe to an event', () => {
        const emitter = new EventEmitter<string>();
        const callback = vi.fn();

        emitter.subscribe(callback);
        emitter.fire('test');

        expect(callback).toHaveBeenCalledWith('test');
    });

    it('should subscribe once to an event', () => {
        const emitter = new EventEmitter<string>();
        const callback = vi.fn();

        emitter.subscribeOnce(callback);
        emitter.fire('test');
        emitter.fire('test2');

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('test');
    });

    it('should check if there are subscriptions', () => {
        const emitter = new EventEmitter<string>();
        const callback = vi.fn();

        expect(emitter.hasSubscriptions()).toBe(false);

        emitter.subscribe(callback);

        expect(emitter.hasSubscriptions()).toBe(true);
    });

    it('should correctly tell the number of subscriptions', () => {
        const emitter = new EventEmitter<string>();
        const callback = vi.fn();

        expect(emitter.subscriptions).toBe(0);

        emitter.subscribe(callback);

        expect(emitter.subscriptions).toBe(1);
        emitter.subscribe(callback);

        expect(emitter.subscriptions).toBe(2);
    });

    it('should cancel all subscriptions', () => {
        const emitter = new EventEmitter<string>();
        const callback = vi.fn();

        emitter.subscribe(callback);
        emitter.cancelAll();
        emitter.fire('test');

        expect(callback).not.toHaveBeenCalled();
    });

    it('should cancel an individual subscription with a cancellation token', () => {
        const emitter = new EventEmitter<string>();
        const callback = vi.fn();
        const token = new CancellationToken();
        emitter.subscribe(callback, token);

        token.cancel();
        emitter.fire('test');

        expect(callback).not.toHaveBeenCalled();
    });
});
