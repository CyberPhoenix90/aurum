import { CancellationToken, EventEmitter } from 'aurumjs';
import { AbstractContentLayout } from './layouts/abstract_content_layout';
import { AbstractLayout } from './layouts/abstract_layout';
import { DefaultLayout } from './layouts/default_layout';
import { LayoutData, LayoutElementTreeNode, REFOWDIRECTION } from './model';
import { ReflowWorkList } from './reflow_work_list';

const defaultLayout = new DefaultLayout();

export interface NodeChange {
    source: LayoutElementTreeNode;
    innerSizeChanged: boolean;
    outerSizeChanged: boolean;
    positionChanged: boolean;
    changeFlowDirection: REFOWDIRECTION;
}

export class LayoutEngine {
    private layoutData: Map<LayoutElementTreeNode, LayoutData>;
    private reflowWork: ReflowWorkList<NodeChange> = new ReflowWorkList();
    private reflowQueued: boolean;

    public onReflow: EventEmitter<void> = new EventEmitter();
    public onReflowEnd: EventEmitter<{ nodesRecomputed: number; timeTaken: number }> = new EventEmitter();
    public onNodeChange: EventEmitter<NodeChange> = new EventEmitter();

    constructor(rootNode: LayoutElementTreeNode, cancellationToken: CancellationToken) {
        rootNode.children.listenAndRepeat((c) => {});
    }

    public emitChange(change: NodeChange): void {
        if (!this.reflowQueued) {
            queueMicrotask(() => this.reflow());
            this.reflowQueued = true;
        }
        this.reflowWork.push(change);
    }

    private reflow(): void {
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
            const parent = this.getRelevantParent(change.source);
            if (parent) {
                this.pickLayout(parent).onChildChange(change, parent);
            }
        }
        if (change.changeFlowDirection === REFOWDIRECTION.DOWNWARDS || change.changeFlowDirection === REFOWDIRECTION.BIDIRECTIONAL) {
            for (const child of this.iterateChildren(change.source)) {
                this.pickLayout(child).onParentChange(change, child);
            }
        }
    }

    private pickLayout(node: LayoutElementTreeNode): AbstractLayout | AbstractContentLayout {
        if (node.layout.value) {
            return node.layout.value;
        }

        const parent = this.getRelevantParent(node);
        if (parent.contentLayout.value) {
            return parent.contentLayout.value;
        }

        return defaultLayout;
    }

    private *iterateChildren(node: LayoutElementTreeNode): IterableIterator<LayoutElementTreeNode> {
        for (const child of node.children) {
            if (child.spreadLayout.value) {
                yield* this.iterateChildren(child);
            } else {
                yield child;
            }
        }
        return;
    }

    public getRelevantParent(node: LayoutElementTreeNode): LayoutElementTreeNode {
        let ptr = node.parent.value;
        while (ptr && ptr.spreadLayout.value) {
            ptr = ptr.parent.value;
        }

        return ptr;
    }

    public getLayoutDataFor(node: LayoutElementTreeNode): LayoutData {
        return this.layoutData.get(node);
    }
}
