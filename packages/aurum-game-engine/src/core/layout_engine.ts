import { CancellationToken, DataSource, dsMap, dsUnique } from 'aurumjs';
import { CanvasGraphNode } from '../entities/types/canvas/api';
import { LabelGraphNode } from '../entities/types/label/api';
import { SpriteGraphNode } from '../entities/types/sprite/api';
import { Calculation } from '../math/calculation';
import { Unit } from '../math/unit';
import { Position, Size } from '../models/common';
import { CommonEntity } from '../models/entities';
import { SceneGraphNode } from '../models/scene_graph';
import { ScreenHelper } from '../utilities/other/screen_helper';

export interface LayoutData {
    x: DataSource<number>;
    y: DataSource<number>;
    width: DataSource<number>;
    height: DataSource<number>;
}

export function layoutAlgorithm(node: SceneGraphNode<CommonEntity>): LayoutData {
    let width: DataSource<number>;
    let height: DataSource<number>;
    let x: DataSource<number>;
    let y: DataSource<number>;

    if (node instanceof SpriteGraphNode || node instanceof CanvasGraphNode) {
        width = node.resolvedModel.width.aggregate([node.onRequestNodeLayoutRefresh, node.processedChildren?.length ?? new DataSource(0)], (v) =>
            v === 'auto' ? undefined : computeSize(v, getParentWidth(node), 0, 'x', node.processedChildren?.getData() ?? [])
        );
        height = node.resolvedModel.height.aggregate([node.onRequestNodeLayoutRefresh, node.processedChildren?.length ?? new DataSource(0)], (v) =>
            v === 'auto' ? undefined : computeSize(v, getParentHeight(node), 0, 'y', node.processedChildren?.getData() ?? [])
        );
    } else if (node instanceof LabelGraphNode) {
        width = node.resolvedModel.width.transform(
            dsMap((size) => (size === 'auto' ? undefined : computeSize(size, getParentWidth(node), 0, 'x', node.processedChildren?.getData() ?? [])))
        );
        height = node.resolvedModel.height.transform(
            dsMap((size) => (size === 'auto' ? undefined : computeSize(size, getParentHeight(node), 0, 'y', node.processedChildren?.getData() ?? [])))
        );
    } else {
        width = node.resolvedModel.width.aggregate([node.onRequestNodeLayoutRefresh], (v) =>
            computeSize(v, getParentWidth(node), 0, 'x', node.processedChildren?.getData() ?? [])
        );
        height = node.resolvedModel.height.aggregate([node.onRequestNodeLayoutRefresh], (v) =>
            computeSize(v, getParentHeight(node), 0, 'y', node.processedChildren?.getData() ?? [])
        );
    }

    x = node.resolvedModel.x.aggregate([node.onRequestNodeLayoutRefresh], (v) => {
        return computePosition(v, width.value, node.resolvedModel.originX.value, node.resolvedModel.scaleX.value, getParentWidth(node));
    });

    y = node.resolvedModel.y.aggregate([node.onRequestNodeLayoutRefresh], (v) => {
        return computePosition(v, height.value, node.resolvedModel.originY.value, node.resolvedModel.scaleY.value, getParentHeight(node));
    });

    const result: LayoutData = {
        x,
        y,
        width,
        height
    };

    let parentToken: CancellationToken;
    node.parent.listen((p) => {
        if (parentToken) {
            parentToken.cancel();
            parentToken = undefined;
        }
        if (p) {
            width.listen(() => p.refreshNodeLayoutIfContent(), parentToken);
            height.listen(() => p.refreshNodeLayoutIfContent(), parentToken);
            parentToken = new CancellationToken();
            p.renderState.width.transform(dsUnique()).listen(() => {
                if (p.resolvedModel.width.value !== 'content') {
                    node.refreshNodeLayoutIfRelative();
                }
            }, parentToken);
            p.renderState.height.transform(dsUnique()).listen(() => {
                if (p.resolvedModel.height.value !== 'content') {
                    node.refreshNodeLayoutIfRelative();
                }
            }, parentToken);
        }
        node.refreshNodeLayoutIfRelative();
    });

    node.resolvedModel.originX.listen(() => node.refreshNodeLayout());
    node.resolvedModel.originY.listen(() => node.refreshNodeLayout());
    node.resolvedModel.scaleX.listen(() => node.refreshNodeLayout());
    node.resolvedModel.scaleY.listen(() => node.refreshNodeLayout());

    return result;
}

function getParentWidth(node: SceneGraphNode<CommonEntity>): number {
    return node.parent.value?.resolvedModel.width.value === 'content' ? 0 : node.parent.value?.renderState?.width.value ?? 0;
}

function getParentHeight(node: SceneGraphNode<CommonEntity>): number {
    return node.parent.value?.resolvedModel.height.value === 'content' ? 0 : node.parent.value?.renderState?.height.value ?? 0;
}

function computeSize(
    value: Size,
    parentSize: number,
    distanceToEdge: number,
    component: 'x' | 'y',
    children: ReadonlyArray<SceneGraphNode<CommonEntity>>
): number {
    if (value === undefined) {
        return 0;
    }

    if (value === 'inherit') {
        value = '100%';
    }
    if (value === 'remainder') {
        return distanceToEdge;
    } else if (value === 'content') {
        return computeContentSize(children, component);
    } else {
        if (typeof value === 'function') {
            return value(parentSize, distanceToEdge, () => computeContentSize(children, component));
        } else if (typeof value === 'number') {
            return value;
        } else if (Calculation.isCalculation(value)) {
            return new Calculation(value).toPixels(96, parentSize, distanceToEdge, () => computeContentSize(children, component));
        } else {
            return new Unit(value).toPixels(96, parentSize);
        }
    }
}

function computeContentSize(children: readonly SceneGraphNode<CommonEntity>[], component: string) {
    if (children.length === 0) {
        return 0;
    }

    const sizes = children.map((c) => {
        if (component === 'x') {
            if (c.isWidthRelative()) {
                return 0;
            } else {
                return c.renderState.x.value + (c.renderState.width.value ?? 0);
            }
        } else {
            if (c.isHeightRelative()) {
                return 0;
            } else {
                return c.renderState.y.value + (c.renderState.height.value ?? 0);
            }
        }
    });

    return Math.max(...sizes);
}

function computePosition(value: Position, size: number, origin: number, scale: number, parentSize: number): number {
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
            computedValue = new Calculation(value).toPixels(ScreenHelper.PPI, parentSize, 0);
        } else {
            computedValue = new Unit(value).toPixels(ScreenHelper.PPI, parentSize);
        }
    }

    return computedValue - origin * (size ?? 0) * scale;
}
