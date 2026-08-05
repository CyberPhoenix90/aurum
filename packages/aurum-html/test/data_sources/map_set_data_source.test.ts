import { assert, describe, it } from 'vitest';
import { ArrayDataSource, CancellationToken, MapChange, MapDataSource, SetChange, SetDataSource } from '../../src/index.js';

describe('MapDataSource', () => {
    it('supports map-compatible reads, iteration, and defensive copying', () => {
        const source = new MapDataSource(new Map([['a', 1], ['b', 2]]));
        assert.equal(source.get('a'), 1);
        assert.isTrue(source.has('b'));
        assert.deepEqual(Array.from(source.keys()), ['a', 'b']);
        assert.deepEqual(Array.from(source.values()), [1, 2]);
        assert.deepEqual(Array.from(source.entries()), [['a', 1], ['b', 2]]);
        const copy = source.toMap();
        copy.set('a', 10);
        assert.equal(source.get('a'), 1);
    });

    it('emits complete set, replace, and delete changes while suppressing no-ops', () => {
        const source = new MapDataSource<string, number>();
        const changes: MapChange<string, number>[] = [];
        source.listen((change) => changes.push(change));
        source.set('a', 1);
        source.set('a', 1);
        source.set('a', 2);
        source.delete('a');
        source.delete('a');
        assert.deepEqual(changes, [
            { key: 'a', oldValue: undefined, newValue: 1 },
            { key: 'a', oldValue: 1, newValue: 2 },
            { key: 'a', oldValue: 2, newValue: undefined, deleted: true }
        ]);
    });

    it('repeats current entries before delivering future changes', () => {
        const source = new MapDataSource(new Map([['a', 1], ['b', 2]]));
        const keys: string[] = [];
        source.listenAndRepeat((change) => keys.push(change.key));
        source.set('c', 3);
        assert.deepEqual(keys, ['a', 'b', 'c']);
    });

    it('supports key-specific listeners and picked values', () => {
        const source = new MapDataSource(new Map([['a', 1]]));
        const changes: MapChange<string, number>[] = [];
        source.listenOnKeyAndRepeat('a', (change) => changes.push(change));
        const picked = source.pick('a');
        source.set('b', 2);
        source.set('a', 3);
        source.delete('a');
        assert.deepEqual(changes.map((change) => change.newValue), [1, 3, undefined]);
        assert.isUndefined(picked.value);
    });

    it('cancels both global and key-specific subscriptions', () => {
        const source = new MapDataSource<string, number>();
        let globalCalls = 0;
        let keyCalls = 0;
        source.listen(() => globalCalls++);
        source.listenOnKey('a', () => keyCalls++);
        source.cancelAll();
        source.set('a', 1);
        assert.equal(globalCalls, 0);
        assert.equal(keyCalls, 0);
    });

    it('pipes initial state and subsequent changes until cancelled', () => {
        const source = new MapDataSource(new Map([['a', 1]]));
        const target = new MapDataSource<string, number>();
        const token = new CancellationToken();
        source.pipe(target, token);
        source.set('a', 2);
        source.set('b', 3);
        source.delete('a');
        token.cancel();
        source.set('c', 4);
        assert.deepEqual(Array.from(target.entries()), [['b', 3]]);
    });

    it('applies serialized map changes including updates', () => {
        const source = new MapDataSource(new Map([['a', 1]]));
        source.applyMapChange({ key: 'a', oldValue: 1, newValue: 2 });
        assert.equal(source.get('a'), 2);
        source.applyMapChange({ key: 'b', oldValue: undefined, newValue: 3 });
        source.applyMapChange({ key: 'a', oldValue: 2, newValue: undefined, deleted: true });
        assert.deepEqual(Array.from(source.entries()), [['b', 3]]);
    });

    it('maps values and cancels each replaced value lifetime', () => {
        const source = new MapDataSource(new Map([['a', 1]]));
        const cancelled: string[] = [];
        const result = source.map((key, value, lifetime) => {
            lifetime.addCancellable(() => cancelled.push(`${key}:${value}`));
            return value * 2;
        }, new CancellationToken());
        source.set('a', 2);
        source.delete('a');
        assert.deepEqual(cancelled, ['a:1', 'a:2']);
        assert.isFalse(result.has('a'));
    });

    it('maintains key, value, and entry array views', () => {
        const source = new MapDataSource(new Map([['a', 1], ['b', 2]]));
        const token = new CancellationToken();
        const keys = source.toKeysArrayDataSource(token);
        const values = source.toArrayDataSource(token);
        const entries = source.toEntriesArrayDataSource(token);
        source.set('a', 3);
        source.delete('b');
        source.set('c', 4);
        assert.deepEqual(keys.toArray(), ['a', 'c']);
        assert.deepEqual(values.toArray(), [3, 4]);
        assert.deepEqual(entries.toArray(), [['a', 3], ['c', 4]]);
    });

    it('distinguishes assign from merge and clears all entries', () => {
        const source = new MapDataSource(new Map([['a', 1], ['b', 2]]));
        source.assign(new Map([['b', 3], ['c', 4]]));
        assert.deepEqual(Array.from(source.entries()), [['a', 1], ['b', 3], ['c', 4]]);
        source.merge(new Map([['c', 5]]));
        assert.deepEqual(Array.from(source.entries()), [['c', 5]]);
        source.clear();
        assert.deepEqual(Array.from(source.entries()), []);
    });

    it('preserves later-map precedence when combining maps', () => {
        const first = new MapDataSource(new Map([['shared', 1], ['first', 1]]));
        const second = new MapDataSource(new Map([['shared', 2], ['second', 2]]));
        const combined = MapDataSource.fromMultipleMaps([first, second]);
        assert.equal(combined.get('shared'), 2);
        first.set('shared', 3);
        assert.equal(combined.get('shared'), 2);
        second.set('later', 4);
        assert.equal(combined.get('later'), 4);
        second.delete('shared');
        assert.equal(combined.get('shared'), 3);
    });

    it('preserves existing instances in conversion helpers', () => {
        const source = new MapDataSource<string, number>();
        assert.strictEqual(MapDataSource.toMapDataSource(source), source);
        assert.equal(MapDataSource.toMapDataSource(new Map([['a', 1]])).get('a'), 1);
    });

    it('exposes changes through an async iterator', async () => {
        const source = new MapDataSource<string, number>();
        const iterator = source.toAsyncIterator();
        source.set('a', 1);
        assert.deepEqual((await iterator.next()).value, { key: 'a', oldValue: undefined, newValue: 1 });
    });

    it('keeps mapped maps and every array projection synchronized through a mutation matrix', () => {
        const source = new MapDataSource(new Map([['a', 1], ['b', 2]]));
        const token = new CancellationToken();
        const mapped = source.map((key, value) => `${key}:${value * 2}`, token);
        const keys = source.toKeysArrayDataSource(token);
        const values = source.toArrayDataSource(token);
        const entries = source.toEntriesArrayDataSource(token);
        const verify = () => {
            assert.deepEqual(Array.from(mapped.entries()), Array.from(source.entries(), ([key, value]) => [key, `${key}:${value * 2}`]));
            assert.deepEqual(keys.toArray(), Array.from(source.keys()));
            assert.deepEqual(values.toArray(), Array.from(source.values()));
            assert.deepEqual(entries.toArray(), Array.from(source.entries()));
        };

        verify();
        source.set('a', 3);
        verify();
        source.set('c', 4);
        verify();
        source.delete('b');
        verify();
        source.assign(new Map([['c', 5], ['d', 6]]));
        verify();
        source.merge(new Map([['e', 7], ['a', 8]]));
        verify();
        source.clear();
        verify();
    });

    it('detaches combined maps and mapped projections with cancellation', () => {
        const first = new MapDataSource(new Map([['a', 1]]));
        const second = new MapDataSource(new Map([['b', 2]]));
        const token = new CancellationToken();
        const combined = MapDataSource.fromMultipleMaps([first, second], token);
        const mapped = first.map((_key, value) => value * 10, token);
        token.cancel();
        first.set('a', 3);
        second.set('b', 4);
        assert.deepEqual(Array.from(combined.entries()), [['a', 1], ['b', 2]]);
        assert.equal(mapped.get('a'), 10);
    });
});

describe('SetDataSource', () => {
    it('supports set-compatible reads, iteration, and defensive copying', () => {
        const source = new SetDataSource([1, 2]);
        assert.equal(source.size, 2);
        assert.deepEqual(Array.from(source), [1, 2]);
        assert.deepEqual(Array.from(source.entries()), [[1, 1], [2, 2]]);
        assert.deepEqual(source.toArray(), [1, 2]);
        const copy = source.toSet();
        copy.add(3);
        assert.isFalse(source.has(3));
    });

    it('emits add and delete changes while suppressing no-ops', () => {
        const source = new SetDataSource<number>();
        const changes: SetChange<number>[] = [];
        source.listen((change) => changes.push(change));
        source.add(1);
        source.add(1);
        source.delete(1);
        source.delete(1);
        assert.deepEqual(changes, [{ key: 1, exists: true }, { key: 1, exists: false }]);
    });

    it('repeats current keys and supports key-specific listeners', () => {
        const source = new SetDataSource([1, 2]);
        const repeated: number[] = [];
        const keyValues: boolean[] = [];
        source.listenAndRepeat((change) => repeated.push(change.key));
        source.listenOnKeyAndRepeat(1, (exists) => keyValues.push(exists));
        source.delete(1);
        assert.deepEqual(repeated, [1, 2, 1]);
        assert.deepEqual(keyValues, [true, false]);
    });

    it('supports picked membership data sources', () => {
        const source = new SetDataSource<string>();
        const picked = source.pick('a');
        const pickedKey = source.pickKey('a');
        source.add('a');
        source.delete('a');
        assert.isFalse(picked.value);
        assert.isFalse(pickedKey.value);
    });

    it('cancels global and key subscriptions', () => {
        const source = new SetDataSource<number>();
        let globalCalls = 0;
        let keyCalls = 0;
        source.listen(() => globalCalls++);
        source.listenOnKey(1, () => keyCalls++);
        source.cancelAll();
        source.add(1);
        assert.equal(globalCalls, 0);
        assert.equal(keyCalls, 0);
    });

    it('applies serialized set changes through normal notifications', () => {
        const source = new SetDataSource<number>();
        const changes: SetChange<number>[] = [];
        source.listen((change) => changes.push(change));
        source.applySetChange({ key: 1, exists: true });
        source.applySetChange({ key: 1, exists: false });
        assert.deepEqual(changes, [{ key: 1, exists: true }, { key: 1, exists: false }]);
    });

    it('reports subset, superset, disjointness, and identity relationships', () => {
        const source = new SetDataSource([1, 2]);
        assert.isTrue(source.isSubsetOf(new Set([1, 2, 3])));
        assert.isTrue(source.isSupersetOf(new Set([1])));
        assert.isTrue(source.isDisjointWith(new Set([3, 4])));
        assert.isTrue(source.isIdenticalTo(new Set([2, 1])));
        assert.isFalse(source.isIdenticalTo(new Set([1])));
    });

    it('maintains dynamic set algebra views', () => {
        const left = new SetDataSource([1, 2]);
        const right = new SetDataSource([2, 3]);
        const token = new CancellationToken();
        const difference = left.difference(right, token);
        const union = left.union(right, token);
        const intersection = left.intersection(right, token);
        const symmetric = left.symmetricDifference(right, token);
        assert.deepEqual(difference.toArray(), [1]);
        assert.deepEqual(new Set(union.toArray()), new Set([1, 2, 3]));
        assert.deepEqual(intersection.toArray(), [2]);
        assert.deepEqual(new Set(symmetric.toArray()), new Set([1, 3]));
        right.delete(2);
        assert.deepEqual(new Set(difference.toArray()), new Set([1, 2]));
        assert.deepEqual(intersection.toArray(), []);
        assert.deepEqual(new Set(symmetric.toArray()), new Set([1, 2, 3]));
    });

    it('maintains mapped and array views until cancelled', () => {
        const source = new SetDataSource([1, 2]);
        const token = new CancellationToken();
        const mapped = source.map((value) => `v${value}`, token);
        const array = source.toArrayDataSource(token);
        source.delete(1);
        source.add(3);
        token.cancel();
        source.add(4);
        assert.deepEqual(mapped.toArray(), ['v2', 'v3']);
        assert.deepEqual(array.toArray(), [2, 3]);
    });

    it('supports merge from sets and array sources and assign without removal', () => {
        const source = new SetDataSource([1, 2]);
        source.merge(new ArrayDataSource([2, 3]));
        assert.deepEqual(new Set(source.toArray()), new Set([2, 3]));
        source.assign(new Set([3, 4]));
        assert.deepEqual(new Set(source.toArray()), new Set([2, 3, 4]));
        source.clear();
        assert.equal(source.size, 0);
    });

    it('preserves existing instances in conversion helpers', () => {
        const source = new SetDataSource<number>();
        assert.strictEqual(SetDataSource.toSetDataSource(source), source);
        assert.isTrue(SetDataSource.toSetDataSource(new Set([1])).has(1));
    });

    it('creates sets from asynchronous iterators and honors cancellation', async () => {
        const token = new CancellationToken();
        async function* values() {
            yield 1;
            await Promise.resolve();
            yield 2;
        }
        const source = SetDataSource.fromAsyncIterator(values(), token);
        const iterator = source.toAsyncIterator();
        const first = await iterator.next();
        token.cancel();
        await Promise.resolve();
        assert.deepEqual(first.value, { key: 1, exists: true });
        assert.deepEqual(source.toArray(), [1]);
    });

    it('keeps every algebra transformation equivalent through mutations on both inputs', () => {
        const left = new SetDataSource([1, 2, 3]);
        const right = new SetDataSource([3, 4]);
        const token = new CancellationToken();
        const difference = left.difference(right, token);
        const union = left.union(right, token);
        const intersection = left.intersection(right, token);
        const symmetric = left.symmetricDifference(right, token);
        const verify = () => {
            const leftSet = left.toSet();
            const rightSet = right.toSet();
            assert.deepEqual(difference.toSet(), new Set([...leftSet].filter((value) => !rightSet.has(value))));
            assert.deepEqual(union.toSet(), new Set([...leftSet, ...rightSet]));
            assert.deepEqual(intersection.toSet(), new Set([...leftSet].filter((value) => rightSet.has(value))));
            assert.deepEqual(symmetric.toSet(), new Set([...leftSet, ...rightSet].filter((value) => leftSet.has(value) !== rightSet.has(value))));
        };

        verify();
        left.add(4);
        verify();
        right.add(2);
        verify();
        left.delete(3);
        verify();
        right.delete(4);
        verify();
        left.clear();
        verify();
        right.add(5);
        verify();
        right.clear();
        verify();
    });

    it('keeps mapped and array transformations synchronized through a mutation matrix', () => {
        const source = new SetDataSource([1, 2]);
        const token = new CancellationToken();
        const mapped = source.map((value) => `v${value}`, token);
        const array = source.toArrayDataSource(token);
        const verify = () => {
            assert.deepEqual(new Set(mapped.toArray()), new Set([...source].map((value) => `v${value}`)));
            assert.deepEqual(new Set(array.toArray()), source.toSet());
        };

        verify();
        source.add(3);
        verify();
        source.delete(1);
        verify();
        source.merge([4, 5]);
        verify();
        source.clear();
        verify();
    });

    it('detaches all algebra and projection transformations with cancellation', () => {
        const left = new SetDataSource([1]);
        const right = new SetDataSource([2]);
        const token = new CancellationToken();
        const union = left.union(right, token);
        const mapped = left.map((value) => value * 10, token);
        const array = left.toArrayDataSource(token);
        token.cancel();
        left.add(3);
        right.add(4);
        assert.deepEqual(union.toSet(), new Set([1, 2]));
        assert.deepEqual(mapped.toArray(), [10]);
        assert.deepEqual(array.toArray(), [1]);
    });
});
