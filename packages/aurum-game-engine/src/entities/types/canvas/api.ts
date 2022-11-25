import { layoutEngine } from '../../../core/layout_engine.js';
import { RenderableType } from '../../../models/entities.js';
import { SceneGraphNode, SceneGraphNodeModel } from '../../../models/scene_graph.js';
import { CanvasEntity, CanvasEntityRenderModel } from './model.js';

export class CanvasGraphNode extends SceneGraphNode<CanvasEntity> {
    public declare readonly renderState: CanvasEntityRenderModel;

    constructor(config: SceneGraphNodeModel<CanvasEntity>) {
        super(config);
    }

    protected createResolvedModel(): CanvasEntity {
        const base = this.createBaseResolvedModel() as CanvasEntity;
        base.paintOperations = this.getModelSourceWithFallback('paintOperations');
        return base;
    }

    protected createRenderModel(): CanvasEntityRenderModel {
        const { x, y, innerWidth, innerHeight } = layoutEngine.getLayoutDataFor(this);

        return {
            alpha: this.resolvedModel.alpha,
            rotation: this.resolvedModel.rotation,
            clip: this.resolvedModel.clip,
            renderableType: RenderableType.CANVAS,
            x: x,
            y: y,
            width: innerWidth,
            height: innerHeight,
            scaleX: this.resolvedModel.scaleX,
            scaleY: this.resolvedModel.scaleY,
            visible: this.resolvedModel.visible,
            zIndex: this.resolvedModel.zIndex,
            blendMode: this.resolvedModel.blendMode,
            shader: this.resolvedModel.shaders,
            paintOperations: this.resolvedModel.paintOperations
        };
    }
}
