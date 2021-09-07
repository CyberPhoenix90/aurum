import { CancellationToken } from '../utilities/cancellation_token';
import { Callback } from '../utilities/common';
import { EventEmitter } from '../utilities/event_emitter';
import { getValueOf } from '../utilities/sources';
import { ArrayDataSource, CollectionChange, ReadOnlyArrayDataSource } from './data_source';

export type GenericTree<T, K extends keyof T> = {
    [P in K]: GenericTree<T, K>[] | ArrayDataSource<any>;
};

export interface TreeChange<T> {
    parentNode: T;
    changedNode: T;
    index: number;
    operation: 'added' | 'deleted';
}

type TreeIteration<T> = {
    parent: T;
    node: T;
    level: number;
    index: number;
    lastIndex: number;
};

export class TreeDataSource<T, K extends keyof T> {
    private childrenKey: K;
    private roots: ArrayDataSource<GenericTree<T, K>>;
    private updateEvent: EventEmitter<TreeChange<T>>;
    private watchCount: number = 0;
    private watchToken: CancellationToken;

    constructor(childrenKey: K, roots: Array<GenericTree<T, K>> | ArrayDataSource<GenericTree<T, K>>) {
        this.childrenKey = childrenKey;
        this.roots = ArrayDataSource.toArrayDataSource(roots);
        this.updateEvent = new EventEmitter<TreeChange<T>>();
    }

    private watch(cancellationToken: CancellationToken): void {
        this.watchCount++;
        cancellationToken.addCancelable(() => {
            this.watchCount--;
            if (this.watchCount === 0) {
                this.watchToken.cancel();
                this.watchToken = undefined;
            }
        });

        if (!this.watchToken) {
            this.watchToken = new CancellationToken();

            const watchMap = new Map<T, CancellationToken>();
            if (this.roots instanceof ArrayDataSource) {
                this.roots.listen((change) => {
                    this.watchHandleChange(change as any, undefined, watchMap);
                }, this.watchToken);
            }

            for (const root of this.roots) {
                for (const { node } of this.iterateLevelWithMetaData(root, this.roots.length.value)) {
                    if (node[this.childrenKey] instanceof ArrayDataSource) {
                        watchMap.set(node, new CancellationToken());
                        this.watchToken.chain(watchMap.get(node));
                        (node[this.childrenKey] as any as ArrayDataSource<T>).listenAndRepeat((change) => {
                            this.watchHandleChange(change, node, watchMap);
                        }, watchMap.get(node));
                    }
                }
            }
        }
    }

    private watchHandleChange(change: CollectionChange<T>, parent: T, watchMap: Map<T, CancellationToken>): void {
        switch (change.operation) {
            case 'add':
                let i = 0;
                for (const item of change.items) {
                    this.updateEvent.fire({
                        changedNode: item,
                        index: change.index + i++,
                        parentNode: parent,
                        operation: 'added'
                    });
                    if (item[this.childrenKey] instanceof ArrayDataSource) {
                        watchMap.set(item, new CancellationToken());
                        this.watchToken.chain(watchMap.get(item));
                        (item[this.childrenKey] as any as ArrayDataSource<T>).listenAndRepeat((change) => {
                            this.watchHandleChange(change, item, watchMap);
                        }, watchMap.get(item));
                    }
                }
                break;
            case 'remove':
                let j = 0;
                for (const item of change.items) {
                    watchMap.get(item)?.cancel();
                    this.updateEvent.fire({
                        changedNode: item,
                        index: change.index + j++,
                        parentNode: parent,
                        operation: 'deleted'
                    });
                }
                break;
            case 'merge':
                throw new Error('Not implemented');
            case 'replace':
                this.updateEvent.fire({
                    changedNode: change.target,
                    index: change.index,
                    parentNode: parent,
                    operation: 'deleted'
                });
                this.updateEvent.fire({
                    changedNode: change.items[0],
                    index: change.index,
                    parentNode: parent,
                    operation: 'added'
                });
                break;
        }
    }

    public listen(callback: Callback<TreeChange<T>>, cancellationToken: CancellationToken): Callback<void> {
        this.watch(cancellationToken);

        return this.updateEvent.subscribe(callback, cancellationToken).cancel;
    }

    public listenAndRepeat(callback: Callback<TreeChange<T>>, cancellationToken: CancellationToken): Callback<void> {
        for (const { parent, node, index } of this.iterateLevelWithMetaData(this.roots as any, 0)) {
            callback({
                changedNode: node,
                index,
                parentNode: parent,
                operation: 'added'
            });
        }

        return this.listen(callback, cancellationToken);
    }

    private adaptNodeList(nodes: ArrayDataSource<GenericTree<T, K>>, token: CancellationToken, nodeList = new ArrayDataSource<T>()): ArrayDataSource<T> {
        nodes.listenAndRepeat((change) => {
            const adaptMap = new Map<GenericTree<T, K>, CancellationToken>();

            switch (change.operation) {
                case 'add':
                    for (const item of change.items) {
                        this.addItem(adaptMap, token, item, nodeList);
                    }
                    break;
                case 'remove':
                    for (const item of change.items) {
                        this.removeItem(nodeList, adaptMap, item);
                    }
                    break;
                case 'merge':
                    throw new Error('Not implemented');
                case 'replace':
                    this.removeItem(nodeList, adaptMap, change.target);
                    this.addItem(adaptMap, token, change.items[0], nodeList);
                    break;
            }
        }, token);

        return nodeList;
    }

    private adaptNodeTree(
        parent: GenericTree<any, any>,
        nodes: ArrayDataSource<GenericTree<any, any>>,
        mapper: (item: any) => any,
        newKey: string | number | symbol,
        token: CancellationToken
    ): ArrayDataSource<GenericTree<any, any>> {
        nodes = ArrayDataSource.toArrayDataSource(nodes);
        const newRoots = nodes.map(mapper);
        if (parent) {
            parent[newKey as any] = newRoots as any;
        }

        nodes.listenAndRepeat((change) => {
            switch (change.operation) {
                case 'add':
                    let i = change.index;
                    for (const item of change.items) {
                        this.adaptNodeTree(newRoots.get(i++), item[newKey as any] as any, mapper, newKey, token);
                    }
                    break;
                case 'merge':
                    throw new Error('Not implemented');
                case 'replace':
                    this.adaptNodeTree(newRoots[change.index], change.items[0][newKey as any] as any, mapper, newKey, token);
                    break;
            }
        }, token);

        return newRoots as any;
    }

    public map<U, K2 extends keyof U>(
        mapper: (item: T) => U,
        newKey: K2 = this.childrenKey as any,
        cancellationToken?: CancellationToken
    ): TreeDataSource<U, K2> {
        return new TreeDataSource<U, K2>(newKey, this.adaptNodeTree(undefined, this.roots, mapper, newKey, cancellationToken));
    }

    private addItem(
        adaptMap: Map<GenericTree<T, K>, CancellationToken>,
        parentToken: CancellationToken,
        item: GenericTree<T, K>,
        nodeList: ArrayDataSource<T>
    ): void {
        nodeList.push(item as any);
        adaptMap.set(item, new CancellationToken());
        parentToken.chain(adaptMap.get(item));
        const list = ArrayDataSource.toArrayDataSource(item[this.childrenKey]);
        this.adaptNodeList(list, adaptMap.get(item), nodeList);
    }

    private removeItem(nodeList: ArrayDataSource<T>, adaptMap: Map<GenericTree<T, K>, CancellationToken>, item: GenericTree<T, K>): void {
        adaptMap.get(item).cancel();
        nodeList.remove(item as any);
    }

    public createArrayDataSourceOfNodes(cancellationToken: CancellationToken): ReadOnlyArrayDataSource<T> {
        return this.adaptNodeList(this.roots, cancellationToken);
    }

    *[Symbol.iterator](): IterableIterator<T> {
        for (const root of this.roots) {
            yield* this.iterateLevel(root as any);
        }
        return;
    }

    public *iterateWithMetaData() {
        let i = 0;
        for (const root of this.roots) {
            yield* this.iterateLevelWithMetaData(root, this.roots.length.value, undefined, i);
        }
        return;
    }

    private *iterateLevelWithMetaData(
        node: GenericTree<T, K>,
        lastIndex: number,
        parent?: T,
        index: number = 0,
        level: number = 0
    ): IterableIterator<TreeIteration<T>> {
        yield { node: node as any, parent, index, level, lastIndex };
        let i = 0;
        for (const child of node[this.childrenKey]) {
            yield* this.iterateLevelWithMetaData(child, getValueOf(node[this.childrenKey].length), node as any, i++, level + 1);
        }
    }

    private *iterateLevel(level: GenericTree<T, K>): IterableIterator<T> {
        yield level as any;
        for (const child of level[this.childrenKey]) {
            yield* this.iterateLevel(child);
        }
    }
}
