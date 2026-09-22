import { assert, describe, it } from 'vitest';
import { batchRender, listenToRenderBatchState, queueRenderUpdate, renderBatchState } from '../../src/index.js';

describe('render batching edge cases', () => {
    it('returns callback values and reports only outer batch transitions', () => {
        const transitions: boolean[] = [];
        listenToRenderBatchState((active) => transitions.push(active));

        const result = batchRender(() => batchRender(() => 42));

        assert.equal(result, 42);
        assert.deepEqual(transitions, [true, false]);
        assert.isFalse(renderBatchState.active);
    });

    it('rejects asynchronous callbacks and always restores batching state', () => {
        assert.throws(() => batchRender(() => Promise.resolve('unsupported')), /must be synchronous/);
        assert.isFalse(renderBatchState.active);
    });

    it('coalesces by binding while continuing other commits after an error', () => {
        const firstBinding = {};
        const secondBinding = {};
        const commits: string[] = [];
        const commitLatest = (value: string) => commits.push(value);

        assert.throws(() => {
            batchRender(() => {
                queueRenderUpdate(firstBinding, commitLatest, 'intermediate');
                queueRenderUpdate(firstBinding, commitLatest, 'latest');
                queueRenderUpdate(secondBinding, () => {
                    commits.push('error');
                    throw new Error('commit failed');
                });
                queueRenderUpdate({}, () => commits.push('after-error'));
            });
        }, /commit failed/);
        assert.deepEqual(commits, ['latest', 'error', 'after-error']);
    });

    it('flushes updates queued by another commit without re-entering the flusher', () => {
        const order: string[] = [];
        const queuedDuringFlush = {};

        batchRender(() => {
            queueRenderUpdate({}, () => {
                order.push('first');
                batchRender(() => queueRenderUpdate(queuedDuringFlush, () => order.push('second')));
            });
        });
        assert.deepEqual(order, ['first', 'second']);

        // An empty batch is also a supported no-op.
        batchRender((): void => {});
        assert.isFalse(renderBatchState.active);
    });
});
