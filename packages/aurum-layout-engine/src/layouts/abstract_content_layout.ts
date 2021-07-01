import { CancellationToken } from 'aurumjs';
import { LayoutEngine, NodeChange } from '../layout_engine';
import { LayoutElementTreeNode } from '../model';

export abstract class AbstractContentLayout {
    protected token: CancellationToken;

    public onChildChange(change: NodeChange, affectedParent: LayoutElementTreeNode) {}

    public onParentChange(change: NodeChange, affectedChild: LayoutElementTreeNode) {}

    public activate(layoutEngine: LayoutEngine, owner: LayoutElementTreeNode): void {
        if (this.token) {
            throw new Error('Same layout activated twice');
        }

        this.token = new CancellationToken();
        this.onActivate(layoutEngine, owner, this.token);
    }
    public deactivate(): void {
        this.token.cancel();
        this.token = undefined;
    }

    public abstract onActivate(layoutEngine: LayoutEngine, owner: LayoutElementTreeNode, sessionToken: CancellationToken): void;
}
