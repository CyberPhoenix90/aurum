import { afterEach, assert, describe, it } from 'vitest';
import { CancellationToken, DataSource, handleClass, handleStyle, isDataWriter } from '../../src/index.js';

describe('rendering helper public functions', () => {
    let token = new CancellationToken();

    afterEach(() => {
        token.cancel();
        token = new CancellationToken();
    });

    it('normalizes array-valued class data sources on initial and later values', () => {
        const source = new DataSource<string | string[]>(['first', 'second']);
        const result = handleClass(source as never, token) as DataSource<string>;

        assert.equal(result.value, 'first second');
        source.update('single');
        assert.equal(result.value, 'single');
        source.update(['third', 'fourth']);
        assert.equal(result.value, 'third fourth');
    });

    it('ignores nullish entries in static class lists', () => {
        const result = handleClass([null as never, 'present'], token);

        assert.equal(result, ' present');
    });

    it('returns an empty style for unsupported style shapes', () => {
        assert.equal(handleStyle('color: red', token), 'color: red');
        assert.equal(handleStyle([] as never, token), '');
    });

    it('identifies writable and read-only-shaped data sources', () => {
        const writable = new DataSource('value');
        const readOnly = {
            value: 'value',
            listen: (): void => {},
            listenAndRepeat: (): void => {}
        } as never;

        assert.isTrue(isDataWriter(writable));
        assert.isFalse(isDataWriter(readOnly));
    });
});
