import { describe, expect, it } from 'vitest';
import { ArrayDataSource, CancellationToken, ObjectChange, ObjectDataSource } from '../src/index.js';

describe('ObjectDataSource', () => {
    it('owns the outer record and rejects values that are not records', () => {
        const initial = { value: 1 };
        const source = new ObjectDataSource(initial);
        initial.value = 2;

        expect(source.get('value')).toBe(1);
        expect(() => new ObjectDataSource(null as never)).toThrow(/non-null/);
        expect(() => new ObjectDataSource([] as never)).toThrow(/non-array/);
    });

    it('supports null-prototype records and keys named hasOwnProperty', () => {
        const initial = Object.create(null) as Record<string, number | (() => boolean)>;
        initial.value = 1;
        initial.hasOwnProperty = () => false;
        const source = new ObjectDataSource(initial);

        expect(source.hasKey('value')).toBe(true);
        expect(source.hasKey('hasOwnProperty')).toBe(true);
        source.set('value', 2);
        expect(source.get('value')).toBe(2);
    });

    it('emits consistent discriminated set events globally and per key', () => {
        const source = new ObjectDataSource<{ value?: number; missing?: undefined }>({ value: 1 });
        const global: ObjectChange<{ value?: number; missing?: undefined }>[] = [];
        const keyed: ObjectChange<{ value?: number; missing?: undefined }, 'value'>[] = [];
        source.listen((change) => global.push(change));
        source.listenOnKey('value', (change) => keyed.push(change));

        source.set('value', 2);
        source.set('value', 2);
        source.set('missing', undefined);

        expect(global).toEqual([
            { operation: 'set', key: 'value', oldValue: 1, newValue: 2, deleted: false, path: undefined },
            { operation: 'set', key: 'missing', oldValue: undefined, newValue: undefined, deleted: false, path: undefined }
        ]);
        expect(keyed).toEqual([global[0]]);
    });

    it('uses Object.is equality for NaN and signed zero', () => {
        const source = new ObjectDataSource({ value: Number.NaN });
        const changes: ObjectChange<{ value: number }>[] = [];
        source.listen((change) => changes.push(change));

        source.set('value', Number.NaN);
        source.set('value', 0);
        source.set('value', -0);

        expect(changes).toHaveLength(2);
        expect(Object.is(changes[1].newValue, -0)).toBe(true);
    });

    it('emits the same complete deletion event globally and per key', () => {
        const source = new ObjectDataSource<{ value?: number }>({ value: 1 });
        const global: ObjectChange<{ value?: number }>[] = [];
        const keyed: ObjectChange<{ value?: number }, 'value'>[] = [];
        source.listen((change) => global.push(change));
        source.listenOnKey('value', (change) => keyed.push(change));

        source.delete('value');
        source.delete('value');

        expect(global).toEqual([{ operation: 'delete', key: 'value', oldValue: 1, newValue: undefined, deleted: true }]);
        expect(keyed).toEqual(global);
        expect(source.hasKey('value')).toBe(false);
    });

    it('repeats only own enumerable string and symbol keys', () => {
        const inherited = { inherited: 1 };
        const symbol = Symbol('symbol');
        const initial = Object.assign(Object.create(inherited), { own: 2, [symbol]: 3 }) as {
            own: number;
            inherited?: number;
            [symbol]: number;
        };
        const source = new ObjectDataSource(initial);
        const keys: PropertyKey[] = [];
        source.listenAndRepeat((change) => keys.push(change.key));

        expect(keys).toEqual(['own', symbol]);
        expect(source.keys()).toEqual(['own', symbol]);
        expect(source.values()).toEqual([2, 3]);
    });

    it('assigns, replaces, clears, and replays changes correctly', () => {
        const source = new ObjectDataSource<{ a?: number; b?: number; c?: number }>({ a: 1, b: 2 });
        const changes: string[] = [];
        source.listen((change) => changes.push(`${change.operation}:${String(change.key)}`));

        source.assign({ a: 3, c: 4 });
        expect(source.toObject()).toEqual({ a: 3, b: 2, c: 4 });

        source.merge({ b: 5 });
        expect(source.toObject()).toEqual({ b: 5 });

        source.applyObjectChange({ operation: 'set', key: 'a', oldValue: undefined, newValue: 6, deleted: false });
        source.applyObjectChange({ operation: 'delete', key: 'b', oldValue: 5, newValue: undefined, deleted: true });
        expect(source.toObject()).toEqual({ a: 6 });

        source.clear();
        expect(source.toObject()).toEqual({});
        expect(changes).toEqual([
            'set:a',
            'set:c',
            'set:b',
            'delete:a',
            'delete:c',
            'set:a',
            'delete:b',
            'delete:a'
        ]);
    });

    it('creates a bidirectional scalar lens with correct NaN and deletion behavior', () => {
        const source = new ObjectDataSource<{ value?: number }>({ value: Number.NaN });
        const lens = source.pick('value');
        const sourceChanges: ObjectChange<{ value?: number }>[] = [];
        source.listen((change) => sourceChanges.push(change));

        source.set('value', Number.NaN);
        expect(sourceChanges).toEqual([]);

        lens.update(2);
        expect(source.get('value')).toBe(2);
        source.set('value', 3);
        expect(lens.value).toBe(3);
        source.delete('value');
        expect(lens.value).toBeUndefined();
    });

    it('disconnects both directions of scalar lenses on cancellation', () => {
        const source = new ObjectDataSource({ value: 1 });
        const token = new CancellationToken();
        const lens = source.pick('value', token);

        token.cancel();
        lens.update(2);
        expect(source.get('value')).toBe(1);
        source.set('value', 3);
        expect(lens.value).toBe(2);
    });

    it('preserves one-way directionality and cancellation for duplex lenses', () => {
        const source = new ObjectDataSource({ value: 1 });
        const token = new CancellationToken();
        const lens = source.pickDuplex('value', token);

        lens.updateDownstream(2);
        expect(source.get('value')).toBe(1);
        lens.updateUpstream(3);
        expect(source.get('value')).toBe(3);
        source.set('value', 4);
        expect(lens.value).toBe(4);

        token.cancel();
        lens.updateUpstream(5);
        expect(source.get('value')).toBe(4);
        source.set('value', 6);
        expect(lens.value).toBe(5);
    });

    it('propagates every array-lens mutation using independent snapshots', () => {
        const source = new ObjectDataSource({ items: [1] });
        const lens = source.pickArray('items');
        const snapshots: number[][] = [];
        source.listenOnKey('items', (change) => snapshots.push(change.newValue?.slice() ?? []));

        lens.push(2);
        lens.push(3);
        lens.removeAt(0);

        expect(source.get('items')).toEqual([2, 3]);
        expect(snapshots).toEqual([
            [1, 2],
            [1, 2, 3],
            [2, 3]
        ]);
        expect(snapshots[0]).not.toBe(snapshots[1]);
    });

    it('synchronizes array lenses from the parent without feedback updates', () => {
        const source = new ObjectDataSource<{ items?: number[] }>({ items: [1] });
        const lens = source.pickArray('items');
        const changes: ObjectChange<{ items?: number[] }>[] = [];
        source.listen((change) => changes.push(change));

        const replacement = [4, 5];
        source.set('items', replacement);
        expect(lens.toArray()).toEqual([4, 5]);
        expect(changes).toHaveLength(1);

        source.delete('items');
        expect(lens.toArray()).toEqual([]);
        expect(changes).toHaveLength(2);
    });

    it('disconnects both directions of array lenses on cancellation', () => {
        const source = new ObjectDataSource({ items: [1] });
        const token = new CancellationToken();
        const lens = source.pickArray('items', token);

        token.cancel();
        lens.push(2);
        expect(source.get('items')).toEqual([1]);
        source.set('items', [3]);
        expect(lens.toArray()).toEqual([1, 2]);
    });

    it('propagates nested sets and deletions with paths to global and key listeners', () => {
        const source = new ObjectDataSource({ nested: { value: 1, removed: 2 } as { value: number; removed?: number } });
        const nested = source.pickObject('nested');
        const global: ObjectChange<{ nested: { value: number; removed?: number } }>[] = [];
        const keyed: ObjectChange<{ nested: { value: number; removed?: number } }, 'nested'>[] = [];
        source.listen((change) => global.push(change));
        source.listenOnKey('nested', (change) => keyed.push(change));

        nested.set('value', 3);
        nested.delete('removed');

        expect(source.get('nested')).toEqual({ value: 3 });
        expect(global.map((change) => ({ operation: change.operation, path: change.path, value: change.newValue }))).toEqual([
            { operation: 'set', path: ['nested', 'value'], value: { value: 3, removed: 2 } },
            { operation: 'set', path: ['nested', 'removed'], value: { value: 3 } }
        ]);
        expect(keyed).toEqual(global);
    });

    it('supports recursively nested object lenses without duplicating path segments', () => {
        const source = new ObjectDataSource({ outer: { inner: { value: 1 } } });
        const outer = source.pickObject('outer');
        const inner = outer.pickObject('inner');
        const paths: PropertyKey[][] = [];
        source.listen((change) => paths.push(change.path ?? []));

        inner.set('value', 2);

        expect(source.get('outer')).toEqual({ inner: { value: 2 } });
        expect(paths).toEqual([['outer', 'inner', 'value']]);
    });

    it('synchronizes object lenses from replacement and deletion without feedback', () => {
        const source = new ObjectDataSource<{ nested?: { value?: number; other?: number } }>({ nested: { value: 1 } });
        const nested = source.pickObject('nested');
        const changes: ObjectChange<{ nested?: { value?: number; other?: number } }>[] = [];
        source.listen((change) => changes.push(change));

        source.set('nested', { other: 2 });
        expect(nested.toObject()).toEqual({ other: 2 });
        expect(changes).toHaveLength(1);

        source.delete('nested');
        expect(nested.toObject()).toEqual({});
        expect(changes).toHaveLength(2);

        source.set('nested', { value: 4 });
        expect(nested.toObject()).toEqual({ value: 4 });
        expect(changes).toHaveLength(3);
    });

    it('disconnects both directions of object lenses on cancellation', () => {
        const source = new ObjectDataSource({ nested: { value: 1 } });
        const token = new CancellationToken();
        const nested = source.pickObject('nested', token);

        token.cancel();
        nested.set('value', 2);
        expect(source.get('nested')).toEqual({ value: 1 });
        source.set('nested', { value: 3 });
        expect(nested.toObject()).toEqual({ value: 2 });
    });

    it('maps keys in object enumeration order and removes duplicate mapped values safely', () => {
        const source = new ObjectDataSource<Record<string, number>>({ a: 1, b: 1 });
        const token = new CancellationToken();
        const mapped = source.map((_key, value) => value, token);

        source.delete('b');
        expect(mapped.toArray()).toEqual([1]);
        source.set('0', 0);
        expect(mapped.toArray()).toEqual([0, 1]);
        source.set('a', 2);
        expect(mapped.toArray()).toEqual([0, 2]);

        token.cancel();
        source.set('c', 3);
        expect(mapped.toArray()).toEqual([0, 2]);
    });

    it('creates independent aggregate snapshots and honors cancellation', () => {
        const source = new ObjectDataSource({ value: 1 });
        const token = new CancellationToken();
        const aggregate = source.toDataSource(token);
        const initial = aggregate.value;

        source.set('value', 2);
        expect(aggregate.value).toEqual({ value: 2 });
        expect(aggregate.value).not.toBe(initial);
        expect(initial).toEqual({ value: 1 });

        token.cancel();
        source.set('value', 3);
        expect(aggregate.value).toEqual({ value: 2 });
    });

    it('returns a shallow copy from toObject', () => {
        const source = new ObjectDataSource({ value: 1 });
        const copy = source.toObject();
        copy.value = 2;

        expect(source.get('value')).toBe(1);
    });

    it('cancels global and per-key listeners through cancelAll', () => {
        const source = new ObjectDataSource({ value: 1 });
        const global: number[] = [];
        const keyed: number[] = [];
        source.listen((change) => global.push(change.newValue));
        source.listenOnKey('value', (change) => keyed.push(change.newValue));

        source.cancelAll();
        source.set('value', 2);

        expect(global).toEqual([]);
        expect(keyed).toEqual([]);
    });
});
