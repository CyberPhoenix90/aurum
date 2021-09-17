import { CancellationToken, DataSource, EventEmitter, TreeDataSource } from 'aurumjs';
import { AbstractLayout } from './layouts/abstract_layout';
import { BasicLayout } from './layouts/basic_layout';
import { LayoutData, LayoutElementTreeNode, REFOWDIRECTION } from './model';
import { ReflowWorkList } from './reflow_work_list';

const defaultLayout = new BasicLayout();

export interface NodeChange {
    source: LayoutElementTreeNode;
    innerSizeChanged: boolean;
    outerSizeChanged: boolean;
    positionChanged: boolean;
    changeFlowDirection: REFOWDIRECTION;
}

export class LayoutEngine {
    private layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>;
    private reflowWork: ReflowWorkList<NodeChange> = new ReflowWorkList();
    private reflowQueued: boolean;

    public onReflow: EventEmitter<void> = new EventEmitter();
    public onReflowEnd: EventEmitter<{ nodesRecomputed: number; timeTaken: number }> = new EventEmitter();
    public onNodeChange: EventEmitter<NodeChange> = new EventEmitter();
    private layoutCache: WeakMap<LayoutElementTreeNode, DataSource<AbstractLayout>> = new WeakMap();

    constructor(rootNode: LayoutElementTreeNode, cancellationToken: CancellationToken) {
        const layoutTree = new TreeDataSource('children', [rootNode]);
        layoutTree.createArrayDataSourceOfNodes(cancellationToken);
    }

    public emitChange(change: NodeChange): void {
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
            nodesRecomputed: changes,
            timeTaken: performance.now() - t
        });
    }

    private processNodeChange(change: NodeChange) {
        this.onNodeChange.fire(change);
        if (change.changeFlowDirection === REFOWDIRECTION.UPWARDS || change.changeFlowDirection === REFOWDIRECTION.BIDIRECTIONAL) {
            // const parent = this.getRelevantParent(change.source);
            // if (parent) {
            //     this.pickLayout(parent).onChildChange(change, parent);
            // }
        }
        if (change.changeFlowDirection === REFOWDIRECTION.DOWNWARDS || change.changeFlowDirection === REFOWDIRECTION.BIDIRECTIONAL) {
            for (const child of this.iterateChildren(change.source)) {
                this.pickLayout(child).onParentChange(change, child);
            }
        }
    }

    private pickLayout(node: LayoutElementTreeNode): AbstractLayout {
        if (this.layoutCache.has(node)) {
            return this.layoutCache.get(node).value;
        } else {
            let ptr = node.parent.value;
            while (ptr) {
                if (ptr.layout.value) {
                    this.layoutCache.set(node, ptr.layout);
                    return ptr.layout.value;
                } else {
                    ptr = ptr.parent.value;
                }
            }
        }

        return defaultLayout;
    }

    private *iterateChildren(node: LayoutElementTreeNode): IterableIterator<LayoutElementTreeNode> {
        for (const child of node.children) {
            yield child;
        }
        return;
    }

    public getLayoutDataFor(node: LayoutElementTreeNode): LayoutData {
        return this.layoutDataByNode.get(node);
    }
}
