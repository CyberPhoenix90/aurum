import { expect, describe, beforeEach, afterEach, it } from 'vitest';
import * as sinon from 'sinon';
import { SinonFakeTimers } from 'sinon';
import { CancellationToken } from '../src/aurumjs.js';

describe('cancellation token', () => {
    let clock: SinonFakeTimers;
    beforeEach(() => {
        clock = sinon.useFakeTimers();
    });
    afterEach(() => {
        clock.uninstall();
    });

    it('setTimeout should not fire if cancel occurs first', () => {
        const token = new CancellationToken();
        token.setTimeout(() => {
            expect(false).toBe(true);
        });
        token.cancel();
        clock.tick(100);
    });

    it('setTimeout should fire if cancel occurs after', () => {
        return new Promise<void>((resolve) => {
            const token = new CancellationToken();
            token.setTimeout(() => {
                resolve();
            });
            clock.tick(100);
            token.cancel();
        });
    });

    it('setTimeout should be removed from list of cancellables once fired', () => {
        const token = new CancellationToken();
        token.setTimeout(() => {});
        expect(token['cancelables'].length).toBe(1);
        token.setTimeout(() => {});
        expect(token['cancelables'].length).toBe(2);
        token.setTimeout(() => {});
        expect(token['cancelables'].length).toBe(3);
        clock.tick(100);
        expect(token['cancelables'].length).toBe(0);
        token.cancel();
    });
});
