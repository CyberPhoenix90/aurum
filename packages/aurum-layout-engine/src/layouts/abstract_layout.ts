import { CancellationToken, DataSource } from 'aurumjs';
import { NodeChange } from '../layout_engine';
import { LayoutData, LayoutElementTreeNode, ReflowEvent } from '../model';

export abstract class AbstractLayout {
    protected token: CancellationToken;
    private static abstractReflowTriggers: Set<ReflowEvent> = new Set();

    public onSelfChange(self: LayoutElementTreeNode, layoutData: LayoutData, layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>): void {}

    public onChildChange(change: NodeChange, affectedParent: LayoutElementTreeNode, emitChange: (change: NodeChange) => void): void {}

    public onParentChange(
        change: NodeChange,
        affectedChild: LayoutElementTreeNode,
        affectedChildLayout: LayoutData,
        layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>,
        emitChange: (change: NodeChange) => void
    ): void {}

    public createDefaultLayoutData(): LayoutData {
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
