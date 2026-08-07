import { CancellationToken } from '../utilities/cancellation_token.js';
import { Callback } from '../utilities/common.js';
import { EventEmitter } from '../utilities/event_emitter.js';
import {
    AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED,
    emitAurumDevtoolsUpdate,
    linkAurumDevtoolsNodes,
    registerAurumDevtoolsNode,
    setAurumDevtoolsSubscriptionCount,
    unlinkAurumDevtoolsEdge
} from '../devtools.js';
import { ArrayDataSource, CollectionChange, ReadOnlyArrayDataSource } from './data_source.js';

export type GenericTree<T, K extends keyof T> = Omit<T, K> & {
    [P in K]: GenericTree<T, K>[] | ArrayDataSource<GenericTree<T, K>>;
};

export interface TreeChange<T> {
    parentNode?: T;
    changedNode: T;
    index: number;
    previousIndex?: number;
    treeIndex: number;
    previousTreeIndex?: number;
    level: number;
    operation: 'added' | 'deleted' | 'moved';
    collectionChange?: CollectionChange<T>;
}

export interface TreeIteration<T> {
    parent?: T;
    node: T;
    level: number;
    index: number;
    lastIndex: number;
    treeIndex: number;
}

/**
 * An observable, ordered tree. Native child arrays are normalized in place to
 * ArrayDataSources so every subsequent structural mutation can be observed.
 * Nodes must have unique identity and the tree must be acyclic.
 */
export class TreeDataSource<T, K extends keyof T> {
    public readonly roots: ArrayDataSource<GenericTree<T, K>>;

    private readonly updateEvent = new EventEmitter<TreeChange<T>>();
    private readonly structureEvent = new EventEmitter<void>();
    private watchCount = 0;
    private watchToken?: CancellationToken;
    private nodeWatchTokens = new Map<T, CancellationToken>();
    private snapshot: TreeIteration<T>[] = [];
    private childCollectionEdges = new Map<ArrayDataSource<GenericTree<T, K>>, string>();

    constructor(public readonly childrenKey: K, roots: GenericTree<T, K>[] | ArrayDataSource<GenericTree<T, K>>) {
        this.roots = ArrayDataSource.toArrayDataSource(roots);
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            registerAurumDevtoolsNode(this, {
                kind: 'tree-data-source',
                name: `TreeDataSource<${String(childrenKey)}>`,
                getValue: (target) => target.toArray(),
                metadata: { childrenKey }
            });
        }
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            this.updateEvent.observeSubscriptionCount((count) => setAurumDevtoolsSubscriptionCount(this, count), false);
        }
        if (AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) {
            linkAurumDevtoolsNodes(this.roots, this, { kind: 'tree-roots' });
        }
        this.normalizeTree();
    }

    /** The mutable child collection for a node. */
    public getChildren(node: T | GenericTree<T, K>): ArrayDataSource<GenericTree<T, K>> {
        const value = (node as T & Record<K, unknown>)[this.childrenKey];
        if (!(value instanceof ArrayDataSource) && !Array.isArray(value)) {
            throw new TypeError(`Tree node children at ${String(this.childrenKey)} must be an array or ArrayDataSource`);
        }

        const source = ArrayDataSource.toArrayDataSource(value as GenericTree<T, K>[] | ArrayDataSource<GenericTree<T, K>>);
        if (source !== value) {
            (node as unknown as Record<PropertyKey, unknown>)[this.childrenKey] = source;
        }
        return source;
    }

    public listen(callback: Callback<TreeChange<T>>, cancellationToken: CancellationToken = CancellationToken.forever): void {
        this.retainWatch(cancellationToken);
        this.updateEvent.subscribe(callback, cancellationToken);
    }

    public listenAndRepeat(callback: Callback<TreeChange<T>>, cancellationToken: CancellationToken = CancellationToken.forever): void {
        this.listen(callback, cancellationToken);
        for (const metadata of this.snapshot) {
            callback(this.toTreeChange('added', metadata));
        }
    }

    public listenOnce(callback: Callback<TreeChange<T>>, cancellationToken?: CancellationToken): void {
        const subscription = new CancellationToken();
        cancellationToken?.addCancellable(subscription);
        this.listen((change) => {
            subscription.cancel();
            callback(change);
        }, subscription);
    }

    public awaitNextUpdate(cancellationToken?: CancellationToken): Promise<TreeChange<T>> {
        return new Promise((resolve) => this.listenOnce(resolve, cancellationToken));
    }

    public createArrayDataSourceOfNodes(cancellationToken: CancellationToken = CancellationToken.forever): ReadOnlyArrayDataSource<T> {
        const nodeList = new ArrayDataSource<T>(this.toArray());
        linkAurumDevtoolsNodes(this, nodeList, { kind: 'transform', label: 'nodes' }, cancellationToken);
        this.subscribeToStructure(() => nodeList.merge(this.toArray()), cancellationToken);
        return nodeList;
    }

    public map<U, K2 extends keyof U>(
        mapper: (item: T) => U,
        newKey: K2 = this.childrenKey as unknown as K2,
        cancellationToken: CancellationToken = CancellationToken.forever
    ): TreeDataSource<U, K2> {
        const mappedNodes = new Map<T, GenericTree<U, K2>>();
        const mappedChildren = new Map<T, ArrayDataSource<GenericTree<U, K2>>>();
        const mappedRoots = new ArrayDataSource<GenericTree<U, K2>>();

        const mapNode = (sourceNode: T): GenericTree<U, K2> => {
            let mapped = mappedNodes.get(sourceNode);
            if (mapped) {
                return mapped;
            }

            mapped = mapper(sourceNode) as GenericTree<U, K2>;
            if ((typeof mapped !== 'object' && typeof mapped !== 'function') || mapped === null) {
                throw new TypeError('TreeDataSource.map mapper must return an object');
            }
            const children = new ArrayDataSource<GenericTree<U, K2>>();
            (mapped as unknown as Record<PropertyKey, unknown>)[newKey] = children;
            mappedNodes.set(sourceNode, mapped);
            mappedChildren.set(sourceNode, children);
            return mapped;
        };

        const sync = (): void => {
            const retained = new Set<T>();
            const syncNode = (sourceNode: T): GenericTree<U, K2> => {
                retained.add(sourceNode);
                const mapped = mapNode(sourceNode);
                const children = Array.from(this.getChildren(sourceNode), (child) => syncNode(child as unknown as T));
                mappedChildren.get(sourceNode)!.merge(children);
                return mapped;
            };

            mappedRoots.merge(Array.from(this.roots, (root) => syncNode(root as unknown as T)));
            for (const sourceNode of mappedNodes.keys()) {
                if (!retained.has(sourceNode)) {
                    mappedNodes.delete(sourceNode);
                    mappedChildren.delete(sourceNode);
                }
            }
        };

        sync();
        const result = new TreeDataSource<U, K2>(newKey, mappedRoots);
        linkAurumDevtoolsNodes(this, result, { kind: 'transform', label: 'map' }, cancellationToken);
        this.subscribeToStructure(sync, cancellationToken);
        return result;
    }

    public toArray(): T[] {
        return Array.from(this);
    }

    public includes(node: T): boolean {
        return this.toArray().includes(node);
    }

    public *[Symbol.iterator](): IterableIterator<T> {
        this.normalizeTree();
        for (const root of this.roots) {
            yield* this.iterateNode(root);
        }
    }

    public *iterateWithMetaData(): IterableIterator<TreeIteration<T>> {
        this.normalizeTree();
        yield* this.collectSnapshot();
    }

    private *iterateNode(node: GenericTree<T, K>): IterableIterator<T> {
        yield node as unknown as T;
        for (const child of this.getChildren(node as unknown as T)) {
            yield* this.iterateNode(child);
        }
    }

    private retainWatch(cancellationToken: CancellationToken): void {
        this.watchCount++;
        let active = true;
        cancellationToken.addCancellable(() => {
            if (!active) {
                return;
            }
            active = false;
            this.watchCount--;
            if (this.watchCount === 0) {
                this.stopWatching();
            }
        });

        if (!this.watchToken) {
            this.startWatching();
        }
    }

    private subscribeToStructure(callback: Callback<void>, cancellationToken: CancellationToken): void {
        this.retainWatch(cancellationToken);
        this.structureEvent.subscribe(callback, cancellationToken);
    }

    private startWatching(): void {
        this.normalizeTree();
        this.watchToken = new CancellationToken();
        this.nodeWatchTokens = new Map();
        this.snapshot = this.collectSnapshot();
        this.roots.listen((change) => this.handleCollectionChange(change, undefined), this.watchToken);
        for (const metadata of this.snapshot) {
            this.attachNodeWatcher(metadata.node);
        }
    }

    private stopWatching(): void {
        this.watchToken?.cancel();
        this.watchToken = undefined;
        this.nodeWatchTokens.clear();
        this.snapshot = [];
    }

    private attachNodeWatcher(node: T): void {
        if (this.nodeWatchTokens.has(node)) {
            return;
        }
        const token = new CancellationToken();
        this.watchToken!.addCancellable(token);
        this.nodeWatchTokens.set(node, token);
        this.getChildren(node).listen((change) => this.handleCollectionChange(change, node), token);
    }

    private detachNodeWatcher(node: T): void {
        this.nodeWatchTokens.get(node)?.cancel();
        this.nodeWatchTokens.delete(node);
    }

    private handleCollectionChange(change: CollectionChange<GenericTree<T, K>>, parent?: T): void {
        const previous = this.snapshot;
        const previousByNode = new Map(previous.map((metadata) => [metadata.node, metadata]));

        this.normalizeTree();
        const current = this.collectSnapshot();
        const currentByNode = new Map(current.map((metadata) => [metadata.node, metadata]));

        const removed = previous.filter((metadata) => !currentByNode.has(metadata.node));
        const added = current.filter((metadata) => !previousByNode.has(metadata.node));

        for (const metadata of removed) {
            this.detachNodeWatcher(metadata.node);
        }
        for (const metadata of added) {
            this.attachNodeWatcher(metadata.node);
        }
        this.snapshot = current;

        const publicChange = change as unknown as CollectionChange<T>;
        try {
            const deletionOrder = removed.slice().sort((a, b) => b.level - a.level || a.treeIndex - b.treeIndex);
            for (const metadata of deletionOrder) {
                this.emitChange(this.toTreeChange('deleted', metadata, publicChange));
            }
            for (const metadata of added) {
                this.emitChange(this.toTreeChange('added', metadata, publicChange));
            }

            if (change.operation === 'swap' || change.operation === 'merge') {
                const candidates = change.operation === 'swap' ? new Set(change.items as unknown as T[]) : undefined;
                for (const metadata of current) {
                    const oldMetadata = previousByNode.get(metadata.node);
                    if (
                        oldMetadata &&
                        oldMetadata.parent === parent &&
                        metadata.parent === parent &&
                        oldMetadata.index !== metadata.index &&
                        (!candidates || candidates.has(metadata.node))
                    ) {
                        this.emitChange(this.toTreeChange('moved', metadata, publicChange, oldMetadata));
                    }
                }
            }
        } finally {
            this.structureEvent.fire();
        }
    }

    private toTreeChange(
        operation: TreeChange<T>['operation'],
        metadata: TreeIteration<T>,
        collectionChange?: CollectionChange<T>,
        previous?: TreeIteration<T>
    ): TreeChange<T> {
        return {
            operation,
            changedNode: metadata.node,
            parentNode: metadata.parent,
            index: metadata.index,
            previousIndex: previous?.index,
            treeIndex: metadata.treeIndex,
            previousTreeIndex: previous?.treeIndex,
            level: metadata.level,
            collectionChange
        };
    }

    private emitChange(change: TreeChange<T>): void {
        emitAurumDevtoolsUpdate(this, {
            kind: change.operation,
            details: {
                changedNode: change.changedNode,
                index: change.index,
                previousIndex: change.previousIndex,
                treeIndex: change.treeIndex,
                previousTreeIndex: change.previousTreeIndex,
                level: change.level
            }
        });
        this.updateEvent.fire(change);
    }

    private collectSnapshot(): TreeIteration<T>[] {
        const result: TreeIteration<T>[] = [];
        const visit = (node: GenericTree<T, K>, parent: T | undefined, index: number, siblingCount: number, level: number): void => {
            result.push({
                node: node as unknown as T,
                parent,
                index,
                lastIndex: siblingCount - 1,
                level,
                treeIndex: result.length
            });
            const children = this.getChildren(node as unknown as T);
            let childIndex = 0;
            for (const child of children) {
                visit(child, node as unknown as T, childIndex++, children.length.value, level + 1);
            }
        };

        let rootIndex = 0;
        for (const root of this.roots) {
            visit(root, undefined, rootIndex++, this.roots.length.value, 0);
        }
        return result;
    }

    private normalizeTree(): void {
        const seen = new Set<T>();
        const ancestors = new Set<T>();
        const childCollections = new Set<ArrayDataSource<GenericTree<T, K>>>();
        for (const root of this.roots) {
            this.normalizeNode(root, seen, ancestors, childCollections);
        }
        for (const [collection, edgeId] of this.childCollectionEdges) {
            if (!childCollections.has(collection)) {
                unlinkAurumDevtoolsEdge(edgeId);
                this.childCollectionEdges.delete(collection);
            }
        }
        for (const collection of childCollections) {
            if (this.childCollectionEdges.has(collection)) continue;
            const edgeId = linkAurumDevtoolsNodes(collection, this, { kind: 'tree-children' });
            if (edgeId) this.childCollectionEdges.set(collection, edgeId);
        }
    }

    private normalizeNode(
        node: GenericTree<T, K>,
        seen: Set<T>,
        ancestors: Set<T>,
        childCollections: Set<ArrayDataSource<GenericTree<T, K>>>
    ): void {
        const typedNode = node as unknown as T;
        if ((typeof typedNode !== 'object' && typeof typedNode !== 'function') || typedNode === null) {
            throw new TypeError('TreeDataSource nodes must be objects');
        }
        if (ancestors.has(typedNode)) {
            throw new Error('TreeDataSource cannot contain cycles');
        }
        if (seen.has(typedNode)) {
            throw new Error('TreeDataSource nodes must have unique identity');
        }

        seen.add(typedNode);
        ancestors.add(typedNode);
        const children = this.getChildren(typedNode);
        childCollections.add(children);
        for (const child of children) {
            this.normalizeNode(child, seen, ancestors, childCollections);
        }
        ancestors.delete(typedNode);
    }
}
