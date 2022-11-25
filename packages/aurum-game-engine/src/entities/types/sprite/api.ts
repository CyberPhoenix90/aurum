import { layoutEngine } from '../../../core/layout_engine.js';
import { RenderableType } from '../../../models/entities.js';
import { SceneGraphNode, SceneGraphNodeModel } from '../../../models/scene_graph.js';
import { SpriteEntity, SpriteEntityRenderModel } from './model.js';

export class SpriteGraphNode extends SceneGraphNode<SpriteEntity> {
    public declare readonly renderState: SpriteEntityRenderModel;

    constructor(config: SceneGraphNodeModel<SpriteEntity>) {
        super(config);
    }

    protected createResolvedModel(): SpriteEntity {
        const base = this.createBaseResolvedModel() as SpriteEntity;

        base.tint = this.getModelSourceWithFallback('tint');
        base.texture = this.getModelSourceWithFallback('texture');
        base.drawDistanceX = this.getModelSourceWithFallback('drawDistanceX');
        base.drawDistanceY = this.getModelSourceWithFallback('drawDistanceY');
        base.drawOffsetX = this.getModelSourceWithFallback('drawOffsetX');
        base.drawOffsetY = this.getModelSourceWithFallback('drawOffsetY');

        return base;
    }

    protected createRenderModel(): SpriteEntityRenderModel {
        const { x, y, innerWidth, innerHeight } = layoutEngine.getLayoutDataFor(this);
        return {
            alpha: this.resolvedModel.alpha,
            rotation: this.resolvedModel.rotation,
            clip: this.resolvedModel.clip,
            renderableType: RenderableType.SPRITE,
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
            tint: this.resolvedModel.tint,
            texture: this.resolvedModel.texture,
            drawDistanceX: this.resolvedModel.drawDistanceX,
            drawDistanceY: this.resolvedModel.drawDistanceY,
            drawOffsetX: this.resolvedModel.drawOffsetX,
            drawOffsetY: this.resolvedModel.drawOffsetY
        };
    }
}
