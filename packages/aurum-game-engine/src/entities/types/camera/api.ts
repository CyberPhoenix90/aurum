import { RenderableType } from '../../../models/entities.js';
import { PointLike } from 'aurum-layout-engine';
import { SceneGraphNode, SceneGraphNodeModel } from '../../../models/scene_graph.js';
import { CameraEntity, CameraEntityRenderModel } from './model.js';
import { layoutEngine } from '../../../core/layout_engine.js';

export class CameraGraphNode extends SceneGraphNode<CameraEntity> {
    public declare readonly renderState: CameraEntityRenderModel;

    constructor(config: SceneGraphNodeModel<CameraEntity>) {
        super(config);
    }

    protected createResolvedModel(): CameraEntity {
        const base = this.createBaseResolvedModel() as CameraEntity;
        base.backgroundColor = this.getModelSourceWithFallback('backgroundColor');
        base.resolutionX = this.getModelSourceWithFallback('resolutionX');
        base.resolutionY = this.getModelSourceWithFallback('resolutionY');
        return base;
    }

    protected createRenderModel(): CameraEntityRenderModel {
        const { x, y, innerWidth, innerHeight } = layoutEngine.getLayoutDataFor(this);

        return {
            view: undefined,
            alpha: this.resolvedModel.alpha,
            rotation: this.resolvedModel.rotation,
            clip: this.resolvedModel.clip,
            renderableType: RenderableType.CAMERA,
            x: x,
            y: y,
            width: innerWidth,
            height: innerHeight,
            scaleX: this.resolvedModel.scaleX,
            scaleY: this.resolvedModel.scaleY,
            visible: this.resolvedModel.visible,
            zIndex: this.resolvedModel.zIndex,
            blendMode: this.resolvedModel.blendMode,
            backgroundColor: this.resolvedModel.backgroundColor,
            shader: this.resolvedModel.shaders
        };
    }

    public projectMouseCoordinates(e: MouseEvent): PointLike {
        return this.projectPoint({
            x: e.clientX,
            y: e.clientY
        });
    }

    public projectPoint(point: PointLike): PointLike {
        const rect = this.renderState.view.getBoundingClientRect();
        const resX = this.getModelValueWithFallback('resolutionX') || this.renderState.width.value;
        const resY = this.getModelValueWithFallback('resolutionY') || this.renderState.height.value;

        return {
            x: ((point.x - rect.left + this.renderState.x.value) * resX) / this.renderState.width.value,
            y: ((point.y - rect.top + this.renderState.y.value) * resY) / this.renderState.height.value
        };
    }
}
