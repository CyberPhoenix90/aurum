import { CancellationToken } from '../utilities/cancellation_token';
import { ArrayDataSource, ReadOnlyArrayDataSource } from './data_source';

export type GenericTree<T, K extends keyof T> = {
    [P in K]: GenericTree<T, K>[] | ArrayDataSource<any>;
};

export class TreeDataSource<T, K extends keyof T> {
    private childrenKey: K;
    private roots: ArrayDataSource<GenericTree<T, K>>;

    constructor(childrenKey: K, roots: Array<GenericTree<T, K>> | ArrayDataSource<GenericTree<T, K>>) {
        this.childrenKey = childrenKey;
        this.roots = ArrayDataSource.toArrayDataSource(roots);
    }

    private adaptNodeList(nodes: ArrayDataSource<GenericTree<T, K>>, token: CancellationToken, nodeList = new ArrayDataSource<T>()): ArrayDataSource<T> {
        nodes.listenAndRepeat((change) => {
            const adaptMap = new Map<GenericTree<T, K>, CancellationToken>();

            switch (change.operation) {
                case 'add':
                    for (const item of change.items) {
                        this.addItem(adaptMap, item, nodeList);
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
                    this.addItem(adaptMap, change.items[0], nodeList);
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

    private addItem(adaptMap: Map<GenericTree<T, K>, CancellationToken>, item: GenericTree<T, K>, nodeList: ArrayDataSource<T>): void {
        nodeList.push(item as any);
        adaptMap.set(item, new CancellationToken());
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

    private *iterateLevel(level: GenericTree<T, K>): IterableIterator<T> {
        yield level as any;
        for (const child of level[this.childrenKey]) {
            yield* this.iterateLevel(child);
        }
    }
}
