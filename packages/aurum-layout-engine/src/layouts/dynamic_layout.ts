import { CancellationToken } from 'aurumjs';
import { NodeChange } from '../layout_engine';
import { Calculation } from '../math/calculation';
import { Unit } from '../math/unit';
import { LayoutData, LayoutElementTreeNode, Position, ReflowEvent, REFOWDIRECTION, Size } from '../model';
import { ScreenHelper } from '../screen_helper';
import { AbstractLayout } from './abstract_layout';

/**
 * The dynamic layout supports numbers, calculations and even callbacks for size and position computation. Complex layouts using this can be expensive. Ideal for use in HUD elements to be able to write a single layout for all screen sizes.
 *
 */
export class DynamicLayout extends AbstractLayout {
    private static dynamicReflowTriggers: Set<ReflowEvent> = new Set(['onChildAdded', 'onChildMoved', 'onChildRemoved', 'onChildResized', 'onParentResized']);

    public reflowTriggers(): Set<ReflowEvent> {
        return DynamicLayout.dynamicReflowTriggers;
    }

    public onLink(
        node: LayoutElementTreeNode,
        layout: LayoutData,
        layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>,
        sessionToken: CancellationToken
    ): void {
        const events = layout.reflowEventListener;
        node.width.aggregate(
            [node.height],
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

        this.onSelfChange(node, layout, layoutDataByNode);
    }

    public onParentChange(
        change: NodeChange,
        affectedChild: LayoutElementTreeNode,
        layout: LayoutData,
        layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>,
        emitChange: (change: NodeChange) => void
    ): void {
        const previousPositionX = layout.x.value;
        const previousPositionY = layout.y.value;
        const previousWidth = layout.innerWidth.value;
        const previousHeight = layout.innerHeight.value;

        layout.x.update(
            this.computePosition(
                affectedChild.x.value,
                layout.outerWidth.value,
                affectedChild.originX.value,
                layoutDataByNode.get(affectedChild.parent.value).innerWidth.value,
                affectedChild.parent.value.marginLeft.value
            )
        );
        layout.y.update(
            this.computePosition(
                affectedChild.y.value,
                layout.outerHeight.value,
                affectedChild.originY.value,
                layoutDataByNode.get(affectedChild.parent.value).innerHeight.value,
                affectedChild.parent.value.marginTop.value
            )
        );

        if (previousPositionX !== layout.x.value || previousPositionY !== layout.y.value) {
            emitChange({
                changeFlowDirection: REFOWDIRECTION.UPWARDS,
                source: affectedChild,
                change: 'onChildMoved'
            });
        }

        layout.innerWidth.update(
            this.computeSize(
                affectedChild.width.value,
                layoutDataByNode.get(affectedChild.parent.value).innerWidth.value,
                'x',
                affectedChild.children.getData(),
                layoutDataByNode
            )
        );
        layout.innerHeight.update(
            this.computeSize(
                affectedChild.height.value,
                layoutDataByNode.get(affectedChild.parent.value).innerHeight.value,
                'y',
                affectedChild.children.getData(),
                layoutDataByNode
            )
        );

        if (previousWidth !== layout.innerWidth.value || previousHeight !== layout.innerHeight.value) {
            emitChange({
                changeFlowDirection: REFOWDIRECTION.UPWARDS,
                source: affectedChild,
                change: 'onChildResized'
            });
            emitChange({
                changeFlowDirection: REFOWDIRECTION.DOWNWARDS,
                source: affectedChild,
                change: 'onParentResized'
            });
        }
    }

    public onSelfChange(node: LayoutElementTreeNode, layout: LayoutData, layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>): void {
        if (node.parent.value) {
            layout.innerWidth.update(
                this.computeSize(node.width.value, layoutDataByNode.get(node.parent.value).innerWidth.value, 'x', node.children.getData(), layoutDataByNode)
            );
            layout.innerHeight.update(
                this.computeSize(node.height.value, layoutDataByNode.get(node.parent.value).innerHeight.value, 'x', node.children.getData(), layoutDataByNode)
            );

            layout.x.update(
                this.computePosition(
                    node.x.value,
                    layout.outerWidth.value,
                    node.originX.value,
                    layoutDataByNode.get(node.parent.value).innerWidth.value,
                    node.parent.value.marginLeft.value
                )
            );
            layout.y.update(
                this.computePosition(
                    node.y.value,
                    layout.outerHeight.value,
                    node.originY.value,
                    layoutDataByNode.get(node.parent.value).innerHeight.value,
                    node.parent.value.marginTop.value
                )
            );
        } else {
            layout.innerWidth.update(this.computeSize(node.width.value, 0, 'x', node.children.getData(), layoutDataByNode));
            layout.innerHeight.update(this.computeSize(node.height.value, 0, 'x', node.children.getData(), layoutDataByNode));

            layout.x.update(this.computePosition(node.x.value, layout.outerWidth.value, node.originX.value, 0, 0));
            layout.y.update(this.computePosition(node.y.value, layout.outerHeight.value, node.originY.value, 0, 0));
        }
        layout.outerWidth.update(layout.innerWidth.value + node.marginLeft.value + node.marginRight.value);
        layout.outerHeight.update(layout.innerHeight.value + node.marginTop.value + node.marginBottom.value);
    }

    private computePosition(value: Position, size: number, origin: number, parentSize: number, parentMargin: number): number {
        if (value === undefined) {
            return 0;
        }

        let computedValue;
        if (typeof value === 'function') {
            computedValue = value(parentSize);
        } else if (typeof value === 'number') {
            computedValue = value;
        } else {
            if (Calculation.isCalculation(value)) {
                computedValue = new Calculation(value).toPixels(ScreenHelper.PPI, parentSize);
            } else {
                computedValue = new Unit(value).toPixels(ScreenHelper.PPI, parentSize);
            }
        }

        return computedValue - origin * (size ?? 0) + parentMargin;
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
