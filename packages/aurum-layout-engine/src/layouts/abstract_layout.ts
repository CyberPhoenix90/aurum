import { CancellationToken, DataSource } from 'aurumjs';
import { NodeChange } from '../layout_engine';
import { LayoutData, LayoutElementTreeNode, ReflowEvents } from '../model';

export abstract class AbstractLayout {
    protected token: CancellationToken;

    public onChildChange(change: NodeChange, affectedParent: LayoutElementTreeNode) {}

    public onParentChange(change: NodeChange, affectedChild: LayoutElementTreeNode) {}

    public initialize(): LayoutData {
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

    public reflowTriggers(owner: LayoutElementTreeNode): ReflowEvents[] {
        return [];
    }

    public link(data: LayoutData, owner: LayoutElementTreeNode, layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>): void {
        if (this.token) {
            throw new Error('Same layout linked twice');
        }

        this.token = new CancellationToken();
        this.onLink(data, owner, layoutDataByNode, this.token);
    }
    public unlink(): void {
        this.token.cancel();
        this.token = undefined;
    }

    public abstract onLink(
        layout: LayoutData,
        owner: LayoutElementTreeNode,
        layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>,
        sessionToken: CancellationToken
    ): void;
}
