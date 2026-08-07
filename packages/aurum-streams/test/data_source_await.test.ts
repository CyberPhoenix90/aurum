import { assert, describe, expect, it } from 'vitest';
import { CancellationToken, DataSource } from '../src/index.js';

describe('DataSource.awaitValue', () => {
    it('returns an existing non-nullish value immediately', async () => {
        const zero = new DataSource<number | null>(0);
        const disabled = new DataSource<boolean | undefined>(false);
        const zeroValue: number = await zero.awaitValue();
        const disabledValue: boolean = await disabled.awaitValue();
        assert.equal(zeroValue, 0);
        assert.isFalse(disabledValue);
    });

    it('skips nullish updates by default', async () => {
        const source = new DataSource<string | null | undefined>();
        const pending = source.awaitValue();
        source.update(null);
        source.update(undefined);
        source.update('ready');
        const value: string = await pending;
        assert.equal(value, 'ready');
    });

    it('supports predicates and preserves type-guard narrowing', async () => {
        type State = { kind: 'loading' } | { kind: 'ready'; value: string };
        type ReadyState = Extract<State, { kind: 'ready' }>;
        const source = new DataSource<State>({ kind: 'loading' });
        const pending = source.awaitValue((value): value is ReadyState => value.kind === 'ready');
        source.update({ kind: 'loading' });
        source.update({ kind: 'ready', value: 'done' });
        const ready: ReadyState = await pending;
        assert.equal(ready.value, 'done');
    });

    it('cleans up and rejects when cancelled', async () => {
        const source = new DataSource<number | undefined>();
        const token = new CancellationToken();
        const pending = source.awaitValue(token);
        token.cancel();
        await expect(pending).rejects.toThrow(/Cancelled/);
    });

    it('rejects when its predicate throws', async () => {
        const source = new DataSource(1);
        await expect(
            source.awaitValue(() => {
                throw new Error('predicate failed');
            })
        ).rejects.toThrow(/predicate failed/);
    });
});
