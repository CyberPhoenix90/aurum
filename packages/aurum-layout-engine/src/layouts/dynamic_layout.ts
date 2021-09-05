import { CancellationToken } from 'aurumjs';
import { Calculation } from '../math/calculation';
import { Unit } from '../math/unit';
import { LayoutData, LayoutElementTreeNode, ReflowEvents, Size } from '../model';
import { AbstractLayout } from './abstract_layout';

/**
 * The dynamic layout supports numbers, calculations and even callbacks for size and position computation. Complex layouts using this can be expensive. Ideal for use in HUD elements to be able to write a single layout for all screen sizes.
 *
 */
export class DynamicLayout extends AbstractLayout {
    public reflowTriggers(owner: LayoutElementTreeNode): ReflowEvents[] {
        return ['onChildAdded', 'onChildMoved', 'onChildRemoved', 'onChildResized', 'onParentResized'];
    }

    public onLink(
        layout: LayoutData,
        owner: LayoutElementTreeNode,
        layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>,
        sessionToken: CancellationToken
    ): void {
        const events = layout.reflowEventListener;
        owner.width.aggregate(
            [owner.height],
            (w, h) => {
                if (this.isSizeRelativeToParent(w) || this.isSizeRelativeToParent(h)) {
                    events.add('onParentResized');
                } else {
                    events.delete('onParentResized');
                }

                if (this.isSizeRelativeToContent(w) || this.isSizeRelativeToContent(h)) {
                    events.add('onChildMoved');
                    events.add('onChildResized');
                    events.add('onChildAdded');
                    events.add('onChildRemoved');
                } else {
                    events.delete('onChildMoved');
                    events.delete('onChildResized');
                    events.delete('onChildAdded');
                    events.delete('onChildRemoved');
                }
            },
            sessionToken
        );

        if (owner.parent.value) {
            layout.innerWidth.update(
                this.computeSize(owner.width.value, layoutDataByNode.get(owner.parent.value).innerWidth.value, 'x', owner.children.getData(), layoutDataByNode)
            );
            layout.outerWidth.update(layout.innerWidth.value + owner.marginLeft.value + owner.marginRight.value);
            layout.innerHeight.update(
                this.computeSize(
                    owner.height.value,
                    layoutDataByNode.get(owner.parent.value).innerHeight.value,
                    'x',
                    owner.children.getData(),
                    layoutDataByNode
                )
            );
            layout.outerHeight.update(layout.innerHeight.value + owner.marginTop.value + owner.marginBottom.value);
        }
    }

    private computeSize(
        value: Size,
        parentSize: number,
        component: 'x' | 'y',
        children: ReadonlyArray<LayoutElementTreeNode>,
        layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>
    ): number {
        if (value === undefined) {
            return 0;
        }

        if (value === 'inherit') {
            value = '100%';
        }
        if (value === 'content') {
            return this.computeContentSize(children, component, layoutDataByNode);
        } else {
            if (typeof value === 'function') {
                return value(parentSize, () => this.computeContentSize(children, component, layoutDataByNode));
            } else if (typeof value === 'number') {
                return value;
            } else if (Calculation.isCalculation(value)) {
                return new Calculation(value).toPixels(96, parentSize, () => this.computeContentSize(children, component, layoutDataByNode));
            } else {
                return new Unit(value).toPixels(96, parentSize);
            }
        }
    }

    private computeContentSize(
        children: ReadonlyArray<LayoutElementTreeNode>,
        component: string,
        layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>
    ): number {
        if (children.length === 0) {
            return 0;
        }

        const sizes: number[] = children.map((c) => {
            if (component === 'x') {
                return layoutDataByNode.get(c).outerWidth.value;
            } else {
                return layoutDataByNode.get(c).outerHeight.value;
            }
        });

        return Math.max(...sizes);
    }

    private isSizeRelativeToContent(value: Size): boolean {
        return (typeof value === 'string' && value.includes('content')) || typeof value === 'function';
    }

    private isSizeRelativeToParent(value: Size): boolean {
        return value === 'inherit' || value === 'remainder' || (typeof value === 'string' && value.includes('%')) || typeof value === 'function';
    }
}
