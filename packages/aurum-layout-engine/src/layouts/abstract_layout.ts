import { CancellationToken } from 'aurumjs';
import { NodeChange } from '../layout_engine';
import { LayoutData, LayoutElementTreeNode, ReflowEvent } from '../model';

export abstract class AbstractLayout {
    protected token: CancellationToken;
    private static abstractReflowTriggers: Set<ReflowEvent> = new Set();

    public onSelfChange(self: LayoutElementTreeNode, layoutData: LayoutData, layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>): void {}

    public onChildChange(
        change: NodeChange,
        affectedParent: LayoutElementTreeNode,
        layout: LayoutData,
        layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>,
        emitChange: (change: NodeChange) => void
    ): void {}

    public onParentChange(
        change: NodeChange,
        affectedChild: LayoutElementTreeNode,
        affectedChildLayout: LayoutData,
        layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>,
        emitChange: (change: NodeChange) => void
    ): void {}

    public reflowTriggers(): Set<ReflowEvent> {
        return AbstractLayout.abstractReflowTriggers;
    }

    public abstract onLink(
        node: LayoutElementTreeNode,
        layout: LayoutData,
        layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>,
        sessionToken: CancellationToken
    ): void;
}
