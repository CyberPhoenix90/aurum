import { assert, describe, it } from 'vitest';
import {
    ArrayDataSource,
    CancellationToken,
    DataSource,
    FilteredArrayView
} from '../../src/index.js';

describe('ArrayDataSource extended contracts', () => {
    it('exposes array-compatible reads without exposing mutable storage', () => {
        const source = new ArrayDataSource([1, 2, 1, 4]);
        const visited: string[] = [];

        assert.equal(source.toString(), '1,2,1,4');
        assert.equal(source.get(1), 2);
        assert.equal(source.indexOf(1), 0);
        assert.equal(source.lastIndexOf(1), 2);
        assert.equal(source.find((value) => value > 2), 4);
        assert.equal(source.findIndex((value) => value > 2), 3);
        assert.isTrue(source.includes(2));
        assert.isTrue(source.some((value) => value % 2 === 0));
        assert.isTrue(source.every((value) => value > 0));
        source.forEach((value, index) => visited.push(`${index}:${value}`));
        assert.deepEqual(visited, ['0:1', '1:2', '2:1', '3:4']);

        const copy = source.toArray();
        copy.push(9);
        assert.deepEqual(source.toArray(), [1, 2, 1, 4]);
        assert.deepEqual([...source], [1, 2, 1, 4]);
    });

    it('reports detailed mutation metadata and item events', () => {
        const source = new ArrayDataSource([1, 2]);
        const changes: Array<{ detail: string; index: number; count: number; items: number[]; state: number[] }> = [];
        const added: number[][] = [];
        const removed: number[][] = [];
        source.listen((change) =>
            changes.push({
                detail: change.operationDetailed,
                index: change.index,
                count: change.count,
                items: [...change.items],
                state: [...change.newState]
            })
        );
        source.onItemsAdded.subscribe((items) => added.push([...items]));
        source.onItemsRemoved.subscribe((items) => removed.push([...items]));

        source.push(3, 4);
        source.insertAt(1, 8);
        source.set(0, 9);
        source.swap(0, 2);
        source.removeAt(1, 2);

        assert.deepEqual(changes, [
            { detail: 'append', index: 2, count: 2, items: [3, 4], state: [1, 2, 3, 4] },
            { detail: 'insert', index: 1, count: 1, items: [8], state: [1, 8, 2, 3, 4] },
            { detail: 'replace', index: 0, count: 1, items: [9], state: [9, 8, 2, 3, 4] },
            { detail: 'swap', index: 0, count: undefined, items: [9, 2], state: [2, 8, 9, 3, 4] },
            { detail: 'remove', index: 1, count: 2, items: [8, 9], state: [2, 3, 4] }
        ]);
        assert.deepEqual(added, [[3, 4], [8], [9]]);
        assert.deepEqual(removed, [[1], [8, 9]]);
        assert.equal(source.length.value, 3);
    });

    it('supports replacement, swapping by value, and all removal variants', () => {
        const source = new ArrayDataSource([1, 2, 3, 4, 5]);

        source.replace(2, 20);
        source.swapItems(20, 4);
        assert.deepEqual(source.toArray(), [1, 4, 3, 20, 5]);
        assert.deepEqual(source.removeRange(1, 3), [4, 3]);
        assert.equal(source.remove(20), 20);
        assert.isUndefined(source.remove(100));
        source.unshift(-1, 0);
        assert.equal(source.shift(), -1);
        assert.equal(source.pop(), 5);
        source.push(6, 7, 8);
        assert.deepEqual(source.removeLeft(2), [0, 1]);
        assert.deepEqual(source.removeRight(2), [7, 8]);
        assert.deepEqual(source.removeWhere((value) => value % 2 === 0), [6]);
        assert.deepEqual(source.toArray(), []);
    });

    it('replays current state and can force dependent views to refresh', () => {
        const source = new ArrayDataSource([1, 2]);
        const replayed: string[] = [];
        source.listenAndRepeat((change) => replayed.push(change.operationDetailed));
        source.repeatCurrentState();
        assert.deepEqual(replayed, ['append', 'clear', 'append']);
        assert.deepEqual(source.toArray(), [1, 2]);
    });

    it('applies each serializable collection change through ordinary operations', () => {
        const source = new ArrayDataSource<number>();
        const apply = (operationDetailed: any, fields: Record<string, any> = {}) =>
            source.applyCollectionChange({ operationDetailed, operation: 'add', items: [], index: 0, count: 0, newState: [], ...fields });

        apply('append', { items: [2, 3] });
        apply('prepend', { items: [1] });
        apply('insert', { index: 2, items: [8] });
        apply('replace', { index: 1, items: [7] });
        apply('swap', { index: 0, index2: 3 });
        apply('remove', { index: 1, count: 1 });
        apply('removeLeft', { count: 1 });
        apply('removeRight', { count: 1 });
        apply('merge', { items: [9, 10] });
        assert.deepEqual(source.toArray(), [9, 10]);
        apply('clear');
        assert.deepEqual(source.toArray(), []);
    });

    it('pipes initial and future state until cancellation', () => {
        const source = new ArrayDataSource([1, 2]);
        const target = new ArrayDataSource<number>();
        const token = new CancellationToken();
        source.pipe(target, token);
        source.push(3);
        assert.deepEqual(target.toArray(), [1, 2, 3]);
        token.cancel();
        source.push(4);
        assert.deepEqual(target.toArray(), [1, 2, 3]);
    });

    it('exposes changes through promises and asynchronous iterators', async () => {
        const source = new ArrayDataSource<number>();
        const next = source.awaitNextUpdate();
        source.push(1);
        assert.equal((await next).operationDetailed, 'append');

        const token = new CancellationToken();
        const iterator = source.toAsyncIterator(token);
        const update = iterator.next();
        source.push(2);
        assert.equal((await update).value.operationDetailed, 'append');
        token.cancel();
        assert.isTrue((await iterator.next()).done);
    });

    it('maintains dynamic slice boundaries', () => {
        const source = new ArrayDataSource([0, 1, 2, 3, 4]);
        const start = new DataSource(1);
        const end = new DataSource(4);
        const view = source.slice(start, end);
        assert.deepEqual(view.toArray(), [1, 2, 3]);
        start.update(2);
        assert.deepEqual(view.toArray(), [2, 3]);
        end.update(5);
        assert.deepEqual(view.toArray(), [2, 3, 4]);
        source.insertAt(0, -1);
        assert.deepEqual(view.toArray(), [1, 2, 3]);
    });

    it('refreshes mapped, filtered, and sorted views when dependencies change', () => {
        const source = new ArrayDataSource([1, 2, 3]);
        const factor = new DataSource(1);
        const mapped = source.map((value) => value * factor.value, [factor]);
        const filtered = source.filter((value) => value >= factor.value, [factor]);
        const sorted = source.sort((a, b) => (a - b) * factor.value, [factor]);

        factor.update(-1);
        assert.deepEqual(mapped.toArray(), [-1, -2, -3]);
        assert.deepEqual(filtered.toArray(), [1, 2, 3]);
        assert.deepEqual(sorted.toArray(), [3, 2, 1]);
    });

    it('supports updating and manually refreshing filtered views', () => {
        const source = new ArrayDataSource([1, 2, 3, 4]);
        const view = source.filter((value) => value % 2 === 0) as FilteredArrayView<number>;
        assert.equal(view.updateFilter((value) => value > 2), 2);
        assert.deepEqual(view.toArray(), [3, 4]);
        view.refresh();
        assert.deepEqual(view.toArray(), [3, 4]);
    });

    it('builds live indexes by property and provider', () => {
        const first = { id: 1, name: 'one' };
        const second = { id: 2, name: 'two' };
        const source = new ArrayDataSource([first, second]);
        const byId = source.indexBy('id');
        const byName = source.indexByProvider((item) => item.name);

        assert.strictEqual(byId.get(1), first);
        assert.strictEqual(byName.get('two'), second);
        const replacement = { id: 3, name: 'three' };
        source.set(0, replacement);
        assert.isFalse(byId.has(1));
        assert.strictEqual(byId.get(3), replacement);
        assert.isFalse(byName.has('one'));
        source.remove(second);
        assert.isFalse(byId.has(2));
    });

    it('builds and maintains single- and multi-key groups', () => {
        const a = { team: 'a', tags: ['x', 'common'] };
        const b = { team: 'b', tags: ['y', 'common'] };
        const source = new ArrayDataSource([a, b]);
        const byProperty = source.groupBy('team');
        const byProvider = source.groupByProvider((item) => item.team);
        const byTags = source.groupByMultiProvider((item) => item.tags);

        assert.deepEqual(byProperty.get('a').toArray(), [a]);
        assert.deepEqual(byProvider.get('b').toArray(), [b]);
        assert.deepEqual(byTags.get('common').toArray(), [a, b]);
        source.remove(a);
        assert.isFalse(byProperty.has('a'));
        assert.deepEqual(byTags.get('common').toArray(), [b]);
        source.push({ team: 'b', tags: ['x'] });
        assert.equal(byProvider.get('b').length.value, 2);
        assert.equal(byTags.get('x').length.value, 1);
    });

    it('can ignore configured mutation kinds in derived views', () => {
        const source = new ArrayDataSource([1, 2]);
        const view = source.map((value) => value * 2, [], undefined, { ignoredOperations: ['append'] });
        assert.deepEqual(view.toArray(), [2, 4]);
        source.push(3);
        assert.deepEqual(view.toArray(), [2, 4]);
        source.insertAt(0, 4);
        assert.deepEqual(view.toArray(), [8, 2, 4]);
    });

    it('maintains reductions and stops maintaining them after cancellation', () => {
        const source = new ArrayDataSource([1, 2, 3]);
        const token = new CancellationToken();
        const total = source.reduce((sum, value) => sum + value, 0, token);
        assert.equal(total.value, 6);
        source.push(4);
        assert.equal(total.value, 10);
        token.cancel();
        source.push(5);
        assert.equal(total.value, 10);
    });

    it('converts arrays, preserves existing instances, and mirrors sets', () => {
        const source = new ArrayDataSource([1, 1, 2]);
        assert.strictEqual(ArrayDataSource.toArrayDataSource(source), source);
        assert.deepEqual(ArrayDataSource.toArrayDataSource([3, 4]).toArray(), [3, 4]);

        const token = new CancellationToken();
        const set = source.toSetDataSource(token);
        assert.deepEqual([...set], [1, 2]);
        source.removeAt(0);
        assert.isTrue(set.has(1));
        source.removeAt(0);
        assert.isFalse(set.has(1));
        token.cancel();
        source.push(5);
        assert.isFalse(set.has(5));
    });

    it('creates progressively populated arrays from promises', async () => {
        let resolve!: (value: number) => void;
        const pending = new Promise<number>((done) => (resolve = done));
        const source = ArrayDataSource.fromPromiseArray([Promise.resolve(1), Promise.reject(new Error('no')), pending]);
        await Promise.resolve();
        await Promise.resolve();
        resolve(3);
        await new Promise((done) => setTimeout(done, 0));

        assert.equal(source.length.value, 3);
        assert.deepEqual(
            source.toArray().map((result) => result.status),
            ['fulfilled', 'rejected', 'fulfilled']
        );
    });

    it('creates arrays from async iterators and stops on cancellation', async () => {
        let release!: () => void;
        async function* values() {
            yield 1;
            await new Promise<void>((done) => (release = done));
            yield 2;
        }
        const token = new CancellationToken();
        const source = ArrayDataSource.fromAsyncIterator(values(), token);
        await new Promise((done) => setTimeout(done, 0));
        assert.deepEqual(source.toArray(), [1]);
        token.cancel();
        release();
        await new Promise((done) => setTimeout(done, 0));
        assert.deepEqual(source.toArray(), [1]);
    });

    it('streams delimited text and JSON responses', async () => {
        let textComplete = false;
        const text = ArrayDataSource.fromFetchText(new Response('a|b|c'), {
            itemSeperatorSequence: '|',
            onComplete: () => (textComplete = true)
        });
        const json = ArrayDataSource.fromFetchJSON<{ id: number }>(new Response('{"id":1}\n{"id":2}\n'), {
            itemSeperatorSequence: '\n'
        });
        await new Promise((done) => setTimeout(done, 0));
        assert.deepEqual(text.toArray(), ['a', 'b', 'c']);
        assert.isTrue(textComplete);
        assert.deepEqual(json.toArray(), [{ id: 1 }, { id: 2 }]);
    });
});
