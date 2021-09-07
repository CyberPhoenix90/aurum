import { CancellationToken, DataSource, dsMap, dsUnique } from 'aurumjs';
import { Position, Size } from 'aurum-layout-engine';
import { CanvasGraphNode } from '../entities/types/canvas/api';
import { LabelGraphNode } from '../entities/types/label/api';
import { SpriteGraphNode } from '../entities/types/sprite/api';
import { Calculation } from '../math/calculation';
import { Unit } from '../math/unit';
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
        p = getLayoutParent(node);
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

function getLayoutParent(node: SceneGraphNode<CommonEntity>): SceneGraphNode<CommonEntity> {
    let ptr = node.parent.value;
    while (ptr && ptr.resolvedModel.wrapperNode.value) {
        ptr = ptr.parent.value;
    }

    return ptr;
}

function getParentWidth(node: SceneGraphNode<CommonEntity>): number {
    return getLayoutParent(node)?.resolvedModel.width.value === 'content' ? 0 : node.parent.value?.renderState?.width.value ?? 0;
}

function getParentHeight(node: SceneGraphNode<CommonEntity>): number {
    return getLayoutParent(node)?.resolvedModel.height.value === 'content' ? 0 : node.parent.value?.renderState?.height.value ?? 0;
}
