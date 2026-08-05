import { assert, describe, it } from 'vitest';
import { ArrayDataSource, CancellationToken, DataSource, ReadOnlyArrayDataSource } from '../../src/aurumjs.js';

function verifyMutationMatrix<T>(
    createView: (source: ArrayDataSource<number>) => ReadOnlyArrayDataSource<T>,
    project: (values: number[]) => T[]
): void {
    const source = new ArrayDataSource([3, 1, 2, 1]);
    const view = createView(source);
    const verify = () => assert.deepEqual(view.toArray(), project(source.toArray()));

    verify();
    source.push(4, 2);
    verify();
    source.unshift(0);
    verify();
    source.insertAt(2, 5, 3);
    verify();
    source.set(3, 6);
    verify();
    source.swap(0, source.length.value - 1);
    verify();
    source.removeAt(1, 2);
    verify();
    source.removeLeft(1);
    verify();
    source.removeRight(1);
    verify();
    source.merge([7, 2, 7, 1, 5]);
    verify();
    source.clear();
    verify();
}

describe('ArrayDataSource transformation mutation matrix', () => {
    it('keeps mapped views equivalent across every mutation family', () => {
        verifyMutationMatrix(
            (source) => source.map((value) => `v${value}`),
            (values) => values.map((value) => `v${value}`)
        );
    });

    it('keeps reversed views equivalent across every mutation family', () => {
        verifyMutationMatrix(
            (source) => source.reverse(),
            (values) => values.reverse()
        );
    });

    it('keeps fixed sliced views equivalent across every mutation family', () => {
        verifyMutationMatrix(
            (source) => source.slice(1, 4),
            (values) => values.slice(1, 4)
        );
    });

    it('keeps unique views equivalent across every mutation family', () => {
        const source = new ArrayDataSource([3, 1, 2, 1]);
        const view = source.unique();
        const verify = () => {
            assert.equal(view.length.value, new Set(source).size);
            assert.deepEqual(new Set(view), new Set(source));
            assert.equal(new Set(view).size, view.length.value);
        };
        verify();
        source.push(4, 2);
        verify();
        source.unshift(0);
        verify();
        source.insertAt(2, 5, 3);
        verify();
        source.set(3, 6);
        verify();
        source.swap(0, source.length.value - 1);
        verify();
        source.removeAt(1, 2);
        verify();
        source.removeLeft(1);
        verify();
        source.removeRight(1);
        verify();
        source.merge([7, 2, 7, 1, 5]);
        verify();
        source.clear();
        verify();
    });

    it('keeps sorted views equivalent across every mutation family', () => {
        verifyMutationMatrix(
            (source) => source.sort((a, b) => a - b),
            (values) => values.sort((a, b) => a - b)
        );
    });

    it('keeps filtered views equivalent across every mutation family', () => {
        verifyMutationMatrix(
            (source) => source.filter((value) => value % 2 === 1),
            (values) => values.filter((value) => value % 2 === 1)
        );
    });

    it('keeps limited views equivalent across every mutation family', () => {
        verifyMutationMatrix(
            (source) => source.limit(3),
            (values) => values.slice(0, 3)
        );
    });

    it('updates flattened views for outer and nested source changes', () => {
        const first = new ArrayDataSource([1, 2]);
        const second = new ArrayDataSource([3]);
        const outer = new ArrayDataSource<ArrayDataSource<number>>([first, second]);
        const flat = outer.flat();
        const verify = () => assert.deepEqual(flat.toArray(), outer.toArray().flatMap((source) => source.toArray()));

        verify();
        first.push(4);
        verify();
        second.unshift(0);
        verify();
        const third = new ArrayDataSource([5, 6]);
        outer.insertAt(1, third);
        verify();
        third.set(0, 7);
        verify();
        outer.swap(0, 2);
        verify();
        outer.remove(third);
        verify();
        third.push(8);
        verify();
        outer.merge([third, first]);
        verify();
        first.clear();
        verify();
        outer.clear();
        verify();
    });

    it('refreshes all dependency-aware transformations and detaches on cancellation', () => {
        const source = new ArrayDataSource([3, 1, 2]);
        const dependency = new DataSource(1);
        const token = new CancellationToken();
        const mapped = source.map((value) => value * dependency.value, [dependency], token);
        const filtered = source.filter((value) => value >= dependency.value, [dependency], token);
        const sorted = source.sort((a, b) => (a - b) * dependency.value, [dependency], token);

        dependency.update(-1);
        assert.deepEqual(mapped.toArray(), [-3, -1, -2]);
        assert.deepEqual(filtered.toArray(), [3, 1, 2]);
        assert.deepEqual(sorted.toArray(), [3, 2, 1]);
        token.cancel();
        dependency.update(2);
        source.push(4);
        assert.deepEqual(mapped.toArray(), [-3, -1, -2]);
        assert.deepEqual(filtered.toArray(), [3, 1, 2]);
        assert.deepEqual(sorted.toArray(), [3, 2, 1]);
    });

    it('maintains indexes through replace, swap, merge, and clear', () => {
        type Item = { id: number; code: string };
        const a: Item = { id: 1, code: 'a' };
        const b: Item = { id: 2, code: 'b' };
        const source = new ArrayDataSource([a, b]);
        const byId = source.indexBy('id');
        const byCode = source.indexByProvider((item) => item.code);
        const c: Item = { id: 3, code: 'c' };

        source.set(0, c);
        assert.deepEqual(Array.from(byId.entries()), [[2, b], [3, c]]);
        assert.deepEqual(Array.from(byCode.entries()), [['b', b], ['c', c]]);
        source.swap(0, 1);
        assert.deepEqual(new Set(byId.values()), new Set([b, c]));
        source.merge([a, c]);
        assert.deepEqual(Array.from(byId.entries()), [[3, c], [1, a]]);
        assert.deepEqual(Array.from(byCode.entries()), [['c', c], ['a', a]]);
        source.clear();
        assert.equal(byId.toMap().size, 0);
        assert.equal(byCode.toMap().size, 0);
    });

    it('maintains all grouping variants through replace, merge, and clear', () => {
        type Item = { group: string; tags: string[]; id: number };
        const a: Item = { group: 'a', tags: ['x', 'all'], id: 1 };
        const b: Item = { group: 'b', tags: ['y', 'all'], id: 2 };
        const source = new ArrayDataSource([a, b]);
        const property = source.groupBy('group');
        const provider = source.groupByProvider((item) => item.group);
        const multiple = source.groupByMultiProvider((item) => item.tags);
        const c: Item = { group: 'b', tags: ['x'], id: 3 };

        source.set(0, c);
        assert.isFalse(property.has('a'));
        assert.deepEqual(property.get('b').toArray(), [b, c]);
        assert.deepEqual(provider.get('b').toArray(), [b, c]);
        assert.deepEqual(multiple.get('all').toArray(), [b]);
        assert.deepEqual(multiple.get('x').toArray(), [c]);

        source.merge([a, c]);
        assert.deepEqual(property.get('a').toArray(), [a]);
        assert.deepEqual(property.get('b').toArray(), [c]);
        assert.deepEqual(multiple.get('all').toArray(), [a]);
        source.clear();
        assert.equal(property.toMap().size, 0);
        assert.equal(provider.toMap().size, 0);
        assert.equal(multiple.toMap().size, 0);
    });

    it('keeps concatenated source boundaries correct after merges and later mutations', () => {
        const first = new ArrayDataSource([1, 2, 3]);
        const second = new ArrayDataSource([10, 11]);
        const third = new ArrayDataSource([20]);
        const combined = ArrayDataSource.fromMultipleSources([first, second, third]);
        const verify = () => assert.deepEqual(combined.toArray(), [...first, ...second, ...third]);

        verify();
        first.merge([4]);
        verify();
        second.push(12);
        verify();
        second.merge([13, 14, 15, 16]);
        verify();
        third.unshift(19);
        verify();
        first.clear();
        verify();
        second.merge([17]);
        verify();
    });

    it('unwraps dynamic values through every outer mutation and cancellation', () => {
        const first = new DataSource(1);
        const second = new DataSource(2);
        const values = new ArrayDataSource<DataSource<number> | number>([first, second, 3]);
        const token = new CancellationToken();
        const unwrapped = ArrayDataSource.DynamicArrayDataSourceToArrayDataSource(values, token);
        const verify = () => assert.deepEqual(unwrapped.toArray(), values.toArray().map((value) => (value instanceof DataSource ? value.value : value)));

        verify();
        first.update(4);
        verify();
        values.unshift(new DataSource(0));
        verify();
        values.insertAt(2, 8);
        verify();
        values.swap(0, 3);
        verify();
        values.set(1, new DataSource(9));
        verify();
        values.removeAt(2);
        verify();
        values.merge([second, 7]);
        verify();
        second.update(6);
        verify();
        token.cancel();
        second.update(10);
        assert.deepEqual(unwrapped.toArray(), [6, 7]);
    });

    it('unwraps repeated dynamic source instances at every occurrence', () => {
        const shared = new DataSource(1);
        const values = new ArrayDataSource([shared, shared]);
        const unwrapped = ArrayDataSource.DynamicArrayDataSourceToArrayDataSource(values, new CancellationToken());
        shared.update(2);
        assert.deepEqual(unwrapped.toArray(), [2, 2]);
        values.removeAt(0);
        shared.update(3);
        assert.deepEqual(unwrapped.toArray(), [3]);
    });
});
