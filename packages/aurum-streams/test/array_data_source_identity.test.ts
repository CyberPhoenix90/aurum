import { assert, describe, it } from 'vitest';
import { ArrayDataSource, CollectionChange, DataSource } from '../src/stream/data_source.js';

describe('ArrayDataSource occurrence identity', () => {
    it('assigns distinct identities to duplicate values', () => {
        const source = new ArrayDataSource(['same', 'same']);
        const identities = source.getItemIdentities();
        assert.lengthOf(identities, 2);
        assert.notEqual(identities[0], identities[1]);
    });

    it('moves identities with swap operations, including duplicate primitives', () => {
        const source = new ArrayDataSource(['same', 'same', 'other']);
        const initial = source.getItemIdentities().slice();
        let change: CollectionChange<string> | undefined;
        source.listen((value) => (change = value));
        source.swap(0, 1);
        assert.deepEqual(source.getItemIdentities(), [initial[1], initial[0], initial[2]]);
        assert.deepEqual(change?.itemIdentities, [initial[0], initial[1]]);
        assert.deepEqual(change?.newStateIdentities, [initial[1], initial[0], initial[2]]);
    });

    it('preserves unaffected identities through insertion, replacement, and removal', () => {
        const source = new ArrayDataSource(['a', 'b', 'c']);
        const initial = source.getItemIdentities().slice();
        source.insertAt(1, 'inserted');
        const inserted = source.getItemIdentities()[1];
        assert.deepEqual(source.getItemIdentities(), [initial[0], inserted, initial[1], initial[2]]);

        source.set(2, 'replacement');
        const replacement = source.getItemIdentities()[2];
        assert.notEqual(replacement, initial[1]);
        assert.deepEqual(source.getItemIdentities(), [initial[0], inserted, replacement, initial[2]]);

        let removal: CollectionChange<string> | undefined;
        source.listen((change) => (removal = change));
        source.removeAt(1, 2);
        assert.deepEqual(removal?.itemIdentities, [inserted, replacement]);
        assert.deepEqual(source.getItemIdentities(), [initial[0], initial[2]]);
    });

    it('reconciles merge identities by occurrence in linear value buckets', () => {
        const first = { value: 'first' };
        const second = { value: 'second' };
        const source = new ArrayDataSource([first, second, first]);
        const initial = source.getItemIdentities().slice();
        source.merge([first, first, second, { value: 'new' }]);
        const identities = source.getItemIdentities();
        assert.deepEqual(identities.slice(0, 3), [initial[0], initial[2], initial[1]]);
        assert.notInclude(initial, identities[3]);
    });

    it('keeps identity metadata out of serialized collection changes', () => {
        const source = new ArrayDataSource<string>();
        let change: CollectionChange<string> | undefined;
        source.listen((value) => (change = value));
        source.push('value');
        assert.deepEqual(JSON.parse(JSON.stringify(change)), {
            operation: 'add',
            operationDetailed: 'append',
            count: 1,
            index: 0,
            items: ['value'],
            newState: ['value']
        });
    });

    it('retains derived-source occurrence identity across precise mutations', () => {
        const source = new ArrayDataSource([1, 2, 3]);
        const mapped = source.map((value) => ({ value }));
        const initial = mapped.getItemIdentities().slice();
        source.swap(0, 2);
        assert.deepEqual(mapped.getItemIdentities(), [initial[2], initial[1], initial[0]]);
        source.push(4);
        assert.deepEqual(mapped.getItemIdentities().slice(0, 3), [initial[2], initial[1], initial[0]]);
    });

    it('propagates occurrence identity through collection transformations', () => {
        const repeated = { value: 1 };
        const other = { value: 2 };
        const parent = new ArrayDataSource([repeated, repeated, other]);
        const parentIdentities = parent.getItemIdentities().slice();

        const mapped = parent.map((value) => ({ wrapped: value }));
        assert.deepEqual(mapped.getItemIdentities(), parentIdentities);

        const reversed = parent.reverse();
        assert.deepEqual(reversed.getItemIdentities(), parentIdentities.slice().reverse());

        const filtered = parent.filter(() => true);
        assert.deepEqual(filtered.getItemIdentities(), parentIdentities);

        const sorted = parent.sort((left, right) => right.value - left.value);
        assert.deepEqual(sorted.getItemIdentities(), [parentIdentities[2], parentIdentities[0], parentIdentities[1]]);

        const start = new DataSource(0);
        const end = new DataSource(2);
        const sliced = parent.slice(start, end);
        assert.deepEqual(sliced.getItemIdentities(), parentIdentities.slice(0, 2));
        start.update(1);
        end.update(3);
        assert.deepEqual(sliced.getItemIdentities(), parentIdentities.slice(1, 3));

        const limited = parent.limit(2);
        assert.deepEqual(limited.getItemIdentities(), parentIdentities.slice(0, 2));

        const uniqueParent = new ArrayDataSource(['duplicate', 'duplicate', 'other']);
        const uniqueParentIdentities = uniqueParent.getItemIdentities();
        const unique = uniqueParent.unique();
        assert.deepEqual(unique.getItemIdentities(), [uniqueParentIdentities[0], uniqueParentIdentities[2]]);
    });

    it('keeps stable child identities when flattened parent occurrences move', () => {
        const parent = new ArrayDataSource<number[]>([
            [1, 2],
            [3, 4]
        ]);
        const flattened = parent.flat();
        const initial = flattened.getItemIdentities().slice();
        parent.swap(0, 1);
        assert.deepEqual(flattened.getData(), [3, 4, 1, 2]);
        assert.deepEqual(flattened.getItemIdentities(), [initial[2], initial[3], initial[0], initial[1]]);
    });
});
