import { ArrayDataSource, CancellationToken, DataSource, dsTap, dsUnique, EventEmitter, TreeDataSource } from 'aurumjs';
import { AbstractLayout } from './layouts/abstract_layout.js';
import { BasicLayout } from './layouts/basic_layout.js';
import { LayoutData, LayoutElementTreeNode, ReflowEvent, REFOWDIRECTION } from './model.js';
import { ReflowWorkList } from './reflow_work_list.js';

export interface NodeChange {
    source: LayoutElementTreeNode;
    change: ReflowEvent;
    changeFlowDirection: REFOWDIRECTION;
}

export class LayoutEngine {
    private layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>;
    private reflowWork: ReflowWorkList<NodeChange> = new ReflowWorkList();
    private reflowQueued: boolean;

    public onReflow: EventEmitter<void> = new EventEmitter();
    public onReflowEnd: EventEmitter<{ changesProcessed: number; timeTaken: number }> = new EventEmitter();
    public onNodeChange: EventEmitter<NodeChange> = new EventEmitter();
    private layoutCache: WeakMap<LayoutElementTreeNode, AbstractLayout> = new WeakMap();
    private rootLayout: AbstractLayout;

    constructor() {
        this.layoutDataByNode = new WeakMap();
        this.boundEmitChange = this.emitChange.bind(this);
    }

    public initialize(rootNode: LayoutElementTreeNode, cancellationToken: CancellationToken, rootLayout = new BasicLayout()) {
        this.rootLayout = rootLayout;
        const layoutTree = new TreeDataSource('children', [rootNode]);
        const nodes = layoutTree.createArrayDataSourceOfNodes(cancellationToken) as ArrayDataSource<LayoutElementTreeNode>;

        const nodeListenMap = new WeakMap<LayoutElementTreeNode, CancellationToken>();
        nodes.onItemsAdded.subscribe((newNodes) => {
            for (const node of newNodes) {
                this.linkNode(node, nodeListenMap);
            }
        }, cancellationToken);

        nodes.onItemsRemoved.subscribe((removedNodes) => {
            for (const node of removedNodes) {
                this.unlinkNode(node, nodeListenMap);
            }
        }, cancellationToken);

        for (const node of nodes) {
            this.linkNode(node, nodeListenMap);
        }
    }

    private unlinkNode(node: LayoutElementTreeNode, nodeListenMap: WeakMap<LayoutElementTreeNode, CancellationToken>): void {
        nodeListenMap.get(node).cancel();
        nodeListenMap.delete(node);
    }

    private createDefaultLayoutData(): LayoutData {
        return {
            x: new DataSource(0),
            y: new DataSource(0),
            innerWidth: new DataSource(0),
            innerHeight: new DataSource(0),
            outerWidth: new DataSource(0),
            outerHeight: new DataSource(0),
            reflowEventListener: new Set()
        };
    }

    private linkNode(node: LayoutElementTreeNode, nodeListenMap: WeakMap<LayoutElementTreeNode, CancellationToken>): void {
        nodeListenMap.set(node, new CancellationToken());
        const cancellationToken = nodeListenMap.get(node);
        let started = false;

        const layout = this.pickLayout(node);
        const layoutData = this.getLayoutDataFor(node);
        layout.onLink(node, layoutData, this.layoutDataByNode, cancellationToken);

        const triggers = layout.reflowTriggers();

        if (triggers.has('onChildAdded')) {
            node.children.onItemsAdded.subscribe(() => {
                if (started) {
                    this.emitChange({
                        changeFlowDirection: REFOWDIRECTION.BIDIRECTIONAL,
                        source: node,
                        change: 'onChildAdded'
                    });
                }
            }, cancellationToken);
        }

        if (triggers.has('onChildRemoved')) {
            node.children.onItemsRemoved.subscribe(() => {
                if (started) {
                    this.emitChange({
                        changeFlowDirection: REFOWDIRECTION.BIDIRECTIONAL,
                        source: node,
                        change: 'onChildRemoved'
                    });
                }
            }, cancellationToken);
        }

        if (triggers.has('onChildMoved')) {
            node.x.transform(
                dsUnique(),
                dsTap(() => {
                    if (started) {
                        this.emitChange({
                            changeFlowDirection: REFOWDIRECTION.UPWARDS,
                            source: node,
                            change: 'onChildMoved'
                        });
                    }
                }),
                cancellationToken
            );

            node.y.transform(
                dsUnique(),
                dsTap(() => {
                    if (started) {
                        this.emitChange({
                            changeFlowDirection: REFOWDIRECTION.UPWARDS,
                            source: node,
                            change: 'onChildMoved'
                        });
                    }
                }),
                cancellationToken
            );
        }

        if (triggers.has('onChildResized') || triggers.has('onParentResized')) {
            node.width.transform(
                dsUnique(),
                dsTap(() => {
                    if (started) {
                        if (triggers.has('onChildResized')) {
                            this.emitChange({
                                changeFlowDirection: REFOWDIRECTION.UPWARDS,
                                source: node,
                                change: 'onChildResized'
                            });
                        }
                    }

                    if (triggers.has('onParentResized')) {
                        this.emitChange({
                            changeFlowDirection: REFOWDIRECTION.DOWNWARDS,
                            source: node,
                            change: 'onParentResized'
                        });
                    }
                }),
                cancellationToken
            );

            node.height.transform(
                dsUnique(),
                dsTap(() => {
                    if (started) {
                        if (triggers.has('onChildResized')) {
                            this.emitChange({
                                changeFlowDirection: REFOWDIRECTION.UPWARDS,
                                source: node,
                                change: 'onChildResized'
                            });
                        }

                        if (triggers.has('onParentResized')) {
                            this.emitChange({
                                changeFlowDirection: REFOWDIRECTION.DOWNWARDS,
                                source: node,
                                change: 'onParentResized'
                            });
                        }
                    }
                }),
                cancellationToken
            );
        }

        if (triggers.has('onChildMoved')) {
            node.marginBottom.transform(
                dsUnique(),
                dsTap(() => {
                    if (started) {
                        this.emitChange({
                            changeFlowDirection: REFOWDIRECTION.UPWARDS,
                            source: node,
                            change: 'onChildResized'
                        });
                    }
                }),
                cancellationToken
            );

            node.marginLeft.transform(
                dsUnique(),
                dsTap(() => {
                    if (started) {
                        this.emitChange({
                            changeFlowDirection: REFOWDIRECTION.UPWARDS,
                            source: node,
                            change: 'onChildResized'
                        });
                    }
                }),
                cancellationToken
            );

            node.marginRight.transform(
                dsUnique(),
                dsTap(() => {
                    if (started) {
                        this.emitChange({
                            changeFlowDirection: REFOWDIRECTION.UPWARDS,
                            source: node,
                            change: 'onChildResized'
                        });
                    }
                }),
                cancellationToken
            );

            node.marginTop.transform(
                dsUnique(),
                dsTap(() => {
                    if (started) {
                        this.emitChange({
                            changeFlowDirection: REFOWDIRECTION.UPWARDS,
                            source: node,
                            change: 'onChildResized'
                        });
                    }
                }),
                cancellationToken
            );
        }

        node.layout.transform(
            dsUnique(),
            dsTap(() => {
                if (started) {
                    throw new Error('Not implemented');
                }
                // this.layoutCache = new WeakMap();
                // this.emitChange({
                //     changeFlowDirection: REFOWDIRECTION.DOWNWARDS,
                //     source: node,
                //     change: 'onLayoutChanged'
                // });
            }),
            cancellationToken
        );

        if (triggers.has('onChildMoved')) {
            node.originX.transform(
                dsUnique(),
                dsTap(() => {
                    if (started) {
                        this.emitChange({
                            changeFlowDirection: REFOWDIRECTION.UPWARDS,
                            source: node,
                            change: 'onChildMoved'
                        });
                    }
                }),
                cancellationToken
            );

            node.originY.transform(
                dsUnique(),
                dsTap(() => {
                    if (started) {
                        this.emitChange({
                            changeFlowDirection: REFOWDIRECTION.UPWARDS,
                            source: node,
                            change: 'onChildMoved'
                        });
                    }
                }),
                cancellationToken
            );

            started = true;
        }
    }

    // To keep emit change private while allowing to use it othersie this class we make a bound reference that we can pass around
    private boundEmitChange: (change: NodeChange) => void;
    private emitChange(change: NodeChange): void {
        if (!this.reflowQueued) {
            queueMicrotask(() => this.reflow());
            this.reflowQueued = true;
        }
        this.reflowWork.push(change);
    }

    private reflow(): void {
        this.reflowQueued = false;
        this.onReflow.fire();
        let changes = 0;
        const t = performance.now();
        for (const change of this.reflowWork) {
            this.processNodeChange(change);
            changes++;
        }

        this.reflowWork.clear();
        this.onReflowEnd.fire({
            changesProcessed: changes,
            timeTaken: performance.now() - t
        });
    }

    private processNodeChange(change: NodeChange) {
        this.onNodeChange.fire(change);

        const layout = this.pickLayout(change.source);
        layout.onSelfChange(change.source, this.layoutDataByNode.get(change.source), this.layoutDataByNode);

        if (change.changeFlowDirection === REFOWDIRECTION.UPWARDS || change.changeFlowDirection === REFOWDIRECTION.BIDIRECTIONAL) {
            const parent = change.source.parent.value;
            if (parent && this.layoutDataByNode.get(parent).reflowEventListener.has(change.change)) {
                const layoutData = this.layoutDataByNode.get(parent);
                this.pickLayout(parent).onChildChange(change, parent, layoutData, this.layoutDataByNode, this.boundEmitChange);
            }
        }
        if (change.changeFlowDirection === REFOWDIRECTION.DOWNWARDS || change.changeFlowDirection === REFOWDIRECTION.BIDIRECTIONAL) {
            for (const child of this.iterateChildren(change.source)) {
                const layoutData = this.layoutDataByNode.get(child);
                if (layoutData.reflowEventListener.has(change.change)) {
                    this.pickLayout(child).onParentChange(change, child, layoutData, this.layoutDataByNode, this.boundEmitChange);
                }
            }
        }
    }

    private pickLayout(node: LayoutElementTreeNode): AbstractLayout {
        if (this.layoutCache.has(node)) {
            return this.layoutCache.get(node);
        } else {
            let ptr = node.parent.value;
            while (ptr) {
                if (ptr.layout.value) {
                    this.layoutCache.set(node, ptr.layout.value);
                    return ptr.layout.value;
                } else {
                    ptr = ptr.parent.value;
                }
            }
        }

        return this.rootLayout;
    }

    private *iterateChildren(node: LayoutElementTreeNode): IterableIterator<LayoutElementTreeNode> {
        for (const child of node.children) {
            yield child;
        }
        return;
    }

    public getLayoutDataFor(node: LayoutElementTreeNode): LayoutData {
        if (!this.layoutDataByNode.has(node)) {
            this.layoutDataByNode.set(node, this.createDefaultLayoutData());
        }
        return this.layoutDataByNode.get(node);
    }
}
