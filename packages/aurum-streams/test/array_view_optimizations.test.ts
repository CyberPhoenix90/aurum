import { describe, expect, it, vi } from 'vitest';
import { ArrayDataSource, CancellationToken, DataSource } from '../src/index.js';

describe('array view update costs and identities', () => {
    it('appends unique values once with their final parent identities', () => {
        const source = new ArrayDataSource([1, 2]);
        const view = source.unique();
        const events: string[] = [];
        view.listen((change) => {
            events.push(change.operationDetailed);
            expect(view.getItemIdentities()).toEqual(source.getItemIdentities().slice(0, 4));
        });
        source.push(3, 4, 3, 4);
        expect(view.toArray()).toEqual([1, 2, 3, 4]);
        expect(events).toEqual(['append']);
    });

    it('keeps unique identity synchronization linear in the parent size', () => {
        const source = new ArrayDataSource(Array.from({ length: 5000 }, (_, index) => index));
        let reads = 0;
        const observed = new Proxy(source.getData(), {
            get(target, property, receiver) {
                if (typeof property === 'string' && /^\d+$/.test(property)) reads++;
                return Reflect.get(target, property, receiver);
            }
        });
        vi.spyOn(source, 'getData').mockReturnValue(observed);
        const view = source.unique();
        reads = 0;
        source.push(5000);
        expect(view.length.value).toBe(5001);
        expect(reads).toBeLessThan(5001 * 4);
    });

    it('handles NaN, signed zero, repeated objects and changing first occurrences', () => {
        const shared = {};
        const source = new ArrayDataSource<unknown>([NaN, -0, shared, NaN, shared]);
        const view = source.unique();
        const verify = () => {
            expect(new Set(view)).toEqual(new Set(source));
            expect(view.length.value).toBe(new Set(source).size);
            expect(view.getItemIdentities()).toEqual(view.toArray().map((value) => {
                const index = source.getData().findIndex((item) => item === value || Object.is(item, value));
                return source.getItemIdentities()[index];
            }));
        };
        verify();
        source.unshift(NaN, 0, shared, 'new', 'new');
        verify();
        source.insertAt(2, 'inserted', 'inserted', NaN);
        verify();
        source.removeAt(0);
        verify();
        source.swap(0, source.length.value - 1);
        verify();
        source.set(0, 'replacement');
        verify();
        source.merge([NaN, NaN, shared, 0, -0]);
        verify();
        source.removeLeft(2);
        verify();
        source.clear();
        verify();
    });

    it('keeps unique ordering on duplicate insertions and reports identity changes once', () => {
        const source = new ArrayDataSource(['a', 'b', 'a']);
        const view = source.unique();
        const events: string[] = [];
        view.listen((change) => events.push(change.operationDetailed));
        source.insertAt(1, 'a');
        expect(events).toEqual([]);
        source.removeAt(0);
        expect(view.toArray()).toEqual(['a', 'b']);
        expect(view.getItemIdentities()).toEqual(source.getItemIdentities().slice(0, 2));
        expect(events).toEqual(['merge']);
    });

    it('updates unique values when an upstream mapping retains identities during refresh', () => {
        const source = new ArrayDataSource([1, 2]);
        const factor = new DataSource(1);
        const mapped = source.map((value) => value * factor.value, [factor]);
        const view = mapped.unique();
        const identities = view.getItemIdentities().slice();
        factor.update(10);
        expect(view.toArray()).toEqual([10, 20]);
        expect(view.getItemIdentities()).toEqual(identities);
    });

    it('uses logarithmic comparisons and a precise event for one sorted insertion', () => {
        const source = new ArrayDataSource(Array.from({ length: 10000 }, (_, index) => (index * 7919) % 10000));
        let comparisons = 0;
        const view = source.sort((a, b) => { comparisons++; return a - b; });
        comparisons = 0;
        const events: string[] = [];
        view.listen((change) => events.push(change.operationDetailed));
        source.push(10000);
        expect(view.toArray()).toEqual(Array.from({ length: 10001 }, (_, index) => index));
        expect(comparisons).toBeLessThanOrEqual(15);
        expect(events).toEqual(['append']);
        expect(view.getItemIdentities()[10000]).toBe(source.getItemIdentities()[10000]);
        comparisons = 0;
        source.removeAt(123);
        expect(comparisons).toBe(0);
        expect(events[1]).toBe('remove');
    });

    it('matches stable native sorting and occurrence identities through mixed mutations', () => {
        type Item = { rank: number; label: number };
        const shared: Item = { rank: 1, label: -1 };
        const source = new ArrayDataSource([shared, { rank: 0, label: 0 }, shared]);
        const direction = new DataSource(1);
        const token = new CancellationToken();
        const compare = (a: Item, b: Item) => (a.rank - b.rank) * direction.value;
        const view = source.sort(compare, [direction], token);
        const verify = () => {
            const expected = source.toArray().map((value, index) => ({ value, identity: source.getItemIdentities()[index] }))
                .sort((a, b) => compare(a.value, b.value));
            expect(view.toArray()).toEqual(expected.map((item) => item.value));
            expect(view.getItemIdentities()).toEqual(expected.map((item) => item.identity));
        };
        verify();
        for (let index = 1; index <= 80; index++) {
            const value = index % 7 === 0 ? shared : { rank: index % 4, label: index };
            source.insertAt(index % (source.length.value + 1), value);
            verify();
            if (index % 3 === 0) { source.swap(0, source.length.value - 1); verify(); }
            if (index % 4 === 0) { source.set(1, shared); verify(); }
            if (index % 5 === 0) { source.removeAt(2, 2); verify(); }
        }
        source.unshift(shared, shared);
        verify();
        source.removeLeft(2);
        verify();
        source.removeRight(3);
        verify();
        source.push(...Array.from({ length: 70 }, (_, label) => ({ rank: label % 4, label })));
        verify();
        direction.update(-1);
        verify();
        source.merge([shared, { rank: 0, label: 5 }, shared]);
        verify();
        source.clear();
        verify();
        source.push(shared);
        verify();
        token.cancel();
        source.push({ rank: 0, label: 8 });
        expect(view.toArray()).toEqual([shared]);
    });

    it('treats NaN comparator results as ties and recovers after ignored changes', () => {
        const source = new ArrayDataSource([1, 2, 3]);
        const view = source.sort(() => NaN, [], undefined, { ignoredOperations: ['append'] });
        source.push(4);
        expect(view.toArray()).toEqual([1, 2, 3]);
        source.unshift(0);
        expect(view.toArray()).toEqual([0, 1, 2, 3, 4]);
        expect(view.getItemIdentities()).toEqual(source.getItemIdentities());
        source.swap(0, 4);
        expect(view.toArray()).toEqual(source.toArray());
        expect(view.getItemIdentities()).toEqual(source.getItemIdentities());
    });

    it('reorders tied occurrences without emitting removals that detach mounted children', () => {
        const source = new ArrayDataSource(['a', 'b', 'c']);
        const view = source.sort(() => 0);
        const operations: string[] = [];
        view.listen((change) => operations.push(change.operationDetailed));
        source.swap(0, 2);
        expect(view.toArray()).toEqual(['c', 'b', 'a']);
        expect(view.getItemIdentities()).toEqual(source.getItemIdentities());
        expect(operations).toEqual(['merge']);
    });
});
