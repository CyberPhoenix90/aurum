import { describe, expect, it } from 'vitest';
import { ArrayDataSource, CancellationToken, TreeChange, TreeDataSource } from '../src/index.js';

interface Node {
    id: string;
    children: Node[] | ArrayDataSource<Node>;
}

function node(id: string, children: Node[] | ArrayDataSource<Node> = []): Node {
    return { id, children };
}

function ids(tree: Iterable<Node>): string[] {
    return Array.from(tree, (item) => item.id);
}

function childSource(tree: TreeDataSource<Node, 'children'>, parent: Node): ArrayDataSource<Node> {
    return tree.getChildren(parent) as ArrayDataSource<Node>;
}

describe('TreeDataSource', () => {
    it('normalizes every native child array and exposes observable roots', () => {
        const grandchild = node('grandchild');
        const child = node('child', [grandchild]);
        const root = node('root', [child]);
        const tree = new TreeDataSource<Node, 'children'>('children', [root]);

        expect(tree.roots).toBeInstanceOf(ArrayDataSource);
        expect(root.children).toBeInstanceOf(ArrayDataSource);
        expect(child.children).toBeInstanceOf(ArrayDataSource);
        expect(grandchild.children).toBeInstanceOf(ArrayDataSource);

        const second = node('second', [node('second-child')]);
        tree.roots.push(second);
        expect(ids(tree)).toEqual(['root', 'child', 'grandchild', 'second', 'second-child']);
        expect(second.children).toBeInstanceOf(ArrayDataSource);
    });

    it('iterates in pre-order with correct root, sibling, level, and global indexes', () => {
        const tree = new TreeDataSource<Node, 'children'>('children', [
            node('a', [node('a1'), node('a2', [node('a2.1')])]),
            node('b')
        ]);

        expect(ids(tree)).toEqual(['a', 'a1', 'a2', 'a2.1', 'b']);
        expect(
            Array.from(tree.iterateWithMetaData(), ({ node: item, parent, index, lastIndex, level, treeIndex }) => ({
                id: item.id,
                parent: parent?.id,
                index,
                lastIndex,
                level,
                treeIndex
            }))
        ).toEqual([
            { id: 'a', parent: undefined, index: 0, lastIndex: 1, level: 0, treeIndex: 0 },
            { id: 'a1', parent: 'a', index: 0, lastIndex: 1, level: 1, treeIndex: 1 },
            { id: 'a2', parent: 'a', index: 1, lastIndex: 1, level: 1, treeIndex: 2 },
            { id: 'a2.1', parent: 'a2', index: 0, lastIndex: 0, level: 2, treeIndex: 3 },
            { id: 'b', parent: undefined, index: 1, lastIndex: 1, level: 0, treeIndex: 4 }
        ]);
    });

    it('rejects missing child collections, cycles, and shared node identity', () => {
        expect(() => new TreeDataSource<Node, 'children'>('children', [{ id: 'bad' } as Node])).toThrow(/array or ArrayDataSource/);

        const cyclic = node('cyclic');
        cyclic.children = [cyclic];
        expect(() => new TreeDataSource<Node, 'children'>('children', [cyclic])).toThrow(/cycles/);

        const shared = node('shared');
        expect(() => new TreeDataSource<Node, 'children'>('children', [node('a', [shared]), node('b', [shared])])).toThrow(/unique identity/);
    });

    it('listenAndRepeat reports the complete current tree with accurate metadata', () => {
        const root = node('root', [node('first'), node('second', [node('nested')])]);
        const tree = new TreeDataSource<Node, 'children'>('children', [root]);
        const token = new CancellationToken();
        const changes: Array<Pick<TreeChange<Node>, 'operation' | 'index' | 'treeIndex' | 'level'> & { id: string; parent?: string }> = [];

        tree.listenAndRepeat(
            (change) =>
                changes.push({
                    id: change.changedNode.id,
                    parent: change.parentNode?.id,
                    operation: change.operation,
                    index: change.index,
                    treeIndex: change.treeIndex,
                    level: change.level
                }),
            token
        );

        expect(changes).toEqual([
            { id: 'root', parent: undefined, operation: 'added', index: 0, treeIndex: 0, level: 0 },
            { id: 'first', parent: 'root', operation: 'added', index: 0, treeIndex: 1, level: 1 },
            { id: 'second', parent: 'root', operation: 'added', index: 1, treeIndex: 2, level: 1 },
            { id: 'nested', parent: 'second', operation: 'added', index: 0, treeIndex: 3, level: 2 }
        ]);
        token.cancel();
    });

    it('observes root and nested additions including their complete subtrees', () => {
        const root = node('root');
        const tree = new TreeDataSource<Node, 'children'>('children', [root]);
        const token = new CancellationToken();
        const changes: TreeChange<Node>[] = [];
        tree.listen((change) => changes.push(change), token);

        childSource(tree, root).push(node('child', [node('grandchild')]));
        tree.roots.push(node('root-2', [node('root-2-child')]));

        expect(changes.map((change) => `${change.operation}:${change.changedNode.id}:${change.parentNode?.id ?? '-'}`)).toEqual([
            'added:child:root',
            'added:grandchild:child',
            'added:root-2:-',
            'added:root-2-child:root-2'
        ]);
        expect(ids(tree)).toEqual(['root', 'child', 'grandchild', 'root-2', 'root-2-child']);
        token.cancel();
    });

    it('reports every removed descendant and stops observing detached subtrees', () => {
        const detachedChildren = new ArrayDataSource<Node>([node('leaf-a'), node('leaf-b')]);
        const branch = node('branch', detachedChildren);
        const root = node('root', [branch]);
        const tree = new TreeDataSource<Node, 'children'>('children', [root]);
        const token = new CancellationToken();
        const changes: string[] = [];
        tree.listen((change) => changes.push(`${change.operation}:${change.changedNode.id}`), token);

        childSource(tree, root).remove(branch);
        detachedChildren.push(node('detached-later'));

        expect(changes).toEqual(['deleted:leaf-a', 'deleted:leaf-b', 'deleted:branch']);
        expect(ids(tree)).toEqual(['root']);
        token.cancel();
    });

    it('replaces subtrees, detaches the old branch, and observes the replacement', () => {
        const oldChildren = new ArrayDataSource<Node>([node('old-leaf')]);
        const oldBranch = node('old', oldChildren);
        const root = node('root', [oldBranch]);
        const tree = new TreeDataSource<Node, 'children'>('children', [root]);
        const token = new CancellationToken();
        const changes: string[] = [];
        tree.listen((change) => changes.push(`${change.operation}:${change.changedNode.id}`), token);

        const replacement = node('new', [node('new-leaf')]);
        childSource(tree, root).set(0, replacement);
        oldChildren.push(node('ignored'));
        childSource(tree, replacement).push(node('new-later'));

        expect(changes).toEqual([
            'deleted:old-leaf',
            'deleted:old',
            'added:new',
            'added:new-leaf',
            'added:new-later'
        ]);
        expect(ids(tree)).toEqual(['root', 'new', 'new-leaf', 'new-later']);
        token.cancel();
    });

    it('observes swaps as moves without treating descendants as removed', () => {
        const first = node('first', [node('first-leaf')]);
        const second = node('second', [node('second-leaf')]);
        const root = node('root', [first, second]);
        const tree = new TreeDataSource<Node, 'children'>('children', [root]);
        const token = new CancellationToken();
        const moves: TreeChange<Node>[] = [];
        tree.listen((change) => moves.push(change), token);

        childSource(tree, root).swap(0, 1);

        expect(ids(tree)).toEqual(['root', 'second', 'second-leaf', 'first', 'first-leaf']);
        expect(moves.map(({ operation, changedNode, previousIndex, index }) => ({ operation, id: changedNode.id, previousIndex, index }))).toEqual([
            { operation: 'moved', id: 'second', previousIndex: 1, index: 0 },
            { operation: 'moved', id: 'first', previousIndex: 0, index: 1 }
        ]);
        token.cancel();
    });

    it('handles merge removals, additions, reordering, and later mutations', () => {
        const removedChildren = new ArrayDataSource<Node>([node('removed-leaf')]);
        const removed = node('removed', removedChildren);
        const retained = node('retained');
        const moved = node('moved');
        const root = node('root', [removed, retained, moved]);
        const tree = new TreeDataSource<Node, 'children'>('children', [root]);
        const token = new CancellationToken();
        const changes: string[] = [];
        tree.listen(
            (change) => changes.push(`${change.operation}:${change.changedNode.id}:${change.previousIndex ?? '-'}>${change.index}`),
            token
        );

        const added = node('added');
        childSource(tree, root).merge([moved, retained, added]);
        childSource(tree, added).push(node('added-leaf'));
        removedChildren.push(node('ignored'));

        expect(changes).toEqual([
            'deleted:removed-leaf:->0',
            'deleted:removed:->0',
            'added:added:->2',
            'moved:moved:2>0',
            'added:added-leaf:->0'
        ]);
        expect(ids(tree)).toEqual(['root', 'moved', 'retained', 'added', 'added-leaf']);
        token.cancel();
    });

    it('keeps watching until the last listener is cancelled and rebuilds watching later', () => {
        const root = node('root');
        const tree = new TreeDataSource<Node, 'children'>('children', [root]);
        const firstToken = new CancellationToken();
        const secondToken = new CancellationToken();
        const first: string[] = [];
        const second: string[] = [];
        tree.listen((change) => first.push(change.changedNode.id), firstToken);
        tree.listen((change) => second.push(change.changedNode.id), secondToken);

        firstToken.cancel();
        childSource(tree, root).push(node('one'));
        secondToken.cancel();

        const lateChildren = new ArrayDataSource<Node>();
        childSource(tree, root).push(node('unwatched', lateChildren));
        const thirdToken = new CancellationToken();
        const third: string[] = [];
        tree.listen((change) => third.push(change.changedNode.id), thirdToken);
        lateChildren.push(node('late-child'));

        expect(first).toEqual([]);
        expect(second).toEqual(['one']);
        expect(third).toEqual(['late-child']);
        thirdToken.cancel();
    });

    it('supports one-shot and promise-based observation', async () => {
        const root = node('root');
        const tree = new TreeDataSource<Node, 'children'>('children', [root]);
        const once: string[] = [];
        tree.listenOnce((change) => once.push(change.changedNode.id));
        const next = tree.awaitNextUpdate();

        childSource(tree, root).push(node('first'));
        childSource(tree, root).push(node('second'));

        await expect(next).resolves.toMatchObject({ operation: 'added', changedNode: { id: 'first' } });
        expect(once).toEqual(['first']);
    });

    it('maintains a correctly ordered flattened data source for every structural operation', () => {
        const first = node('first', [node('first-leaf')]);
        const second = node('second');
        const root = node('root', [first, second]);
        const tree = new TreeDataSource<Node, 'children'>('children', [root]);
        const token = new CancellationToken();
        const flat = tree.createArrayDataSourceOfNodes(token);

        childSource(tree, first).unshift(node('inserted'));
        expect(ids(flat)).toEqual(['root', 'first', 'inserted', 'first-leaf', 'second']);

        childSource(tree, root).swap(0, 1);
        expect(ids(flat)).toEqual(['root', 'second', 'first', 'inserted', 'first-leaf']);

        childSource(tree, root).set(1, node('replacement', [node('replacement-leaf')]));
        expect(ids(flat)).toEqual(['root', 'second', 'replacement', 'replacement-leaf']);

        childSource(tree, root).merge([node('merged-a'), node('merged-b', [node('merged-leaf')])]);
        expect(ids(flat)).toEqual(['root', 'merged-a', 'merged-b', 'merged-leaf']);

        token.cancel();
        childSource(tree, root).clear();
        expect(ids(flat)).toEqual(['root', 'merged-a', 'merged-b', 'merged-leaf']);
    });

    it('maps the full tree reactively while preserving mapped identity for retained nodes', () => {
        interface MappedNode {
            label: string;
            nodes: MappedNode[] | ArrayDataSource<MappedNode>;
        }

        const first = node('first');
        const second = node('second');
        const root = node('root', [first, second]);
        const tree = new TreeDataSource<Node, 'children'>('children', [root]);
        const token = new CancellationToken();
        const calls = new Map<string, number>();
        const mapped = tree.map<MappedNode, 'nodes'>((item) => {
            calls.set(item.id, (calls.get(item.id) ?? 0) + 1);
            return { label: item.id.toUpperCase(), nodes: [] };
        }, 'nodes', token);
        const originalMappedRoot = Array.from(mapped)[0];
        const originalMappedFirst = Array.from(mapped)[1];

        childSource(tree, root).swap(0, 1);
        const added = node('added', [node('added-leaf')]);
        childSource(tree, root).push(added);

        expect(Array.from(mapped, (item) => item.label)).toEqual(['ROOT', 'SECOND', 'FIRST', 'ADDED', 'ADDED-LEAF']);
        expect(Array.from(mapped)[0]).toBe(originalMappedRoot);
        expect(Array.from(mapped)[2]).toBe(originalMappedFirst);
        expect(Object.fromEntries(calls)).toEqual({ root: 1, first: 1, second: 1, added: 1, 'added-leaf': 1 });

        childSource(tree, root).remove(added);
        childSource(tree, root).push(added);
        expect(calls.get('added')).toBe(2);
        expect(calls.get('added-leaf')).toBe(2);

        token.cancel();
        childSource(tree, root).push(node('after-cancel'));
        expect(Array.from(mapped, (item) => item.label)).not.toContain('AFTER-CANCEL');
    });
});
