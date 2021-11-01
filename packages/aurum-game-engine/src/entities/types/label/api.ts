import { layoutEngine } from '../../../core/layout_engine';
import { RenderableType } from '../../../models/entities';
import { SceneGraphNode, SceneGraphNodeModel } from '../../../models/scene_graph';
import { LabelEntity, LabelEntityRenderModel } from './model';

export class LabelGraphNode extends SceneGraphNode<LabelEntity> {
    public declare readonly renderState: LabelEntityRenderModel;

    constructor(config: SceneGraphNodeModel<LabelEntity>) {
        super(config);
    }

    protected createResolvedModel(): LabelEntity {
        const base = this.createBaseResolvedModel() as LabelEntity;

        base.text = this.getModelSourceWithFallback('text');
        base.color = this.getModelSourceWithFallback('color');
        base.dropShadowAngle = this.getModelSourceWithFallback('dropShadowAngle');
        base.renderCharCount = this.getModelSourceWithFallback('renderCharCount');
        base.stroke = this.getModelSourceWithFallback('stroke');
        base.strokeThickness = this.getModelSourceWithFallback('strokeThickness');
        base.fontSize = this.getModelSourceWithFallback('fontSize');
        base.fontWeight = this.getModelSourceWithFallback('fontWeight');
        base.fontStyle = this.getModelSourceWithFallback('fontStyle');
        base.fontFamily = this.getModelSourceWithFallback('fontFamily');
        base.dropShadowColor = this.getModelSourceWithFallback('dropShadowColor');
        base.dropShadowDistance = this.getModelSourceWithFallback('dropShadowDistance');
        base.dropShadowFuzziness = this.getModelSourceWithFallback('dropShadowFuzziness');
        base.textBaseline = this.getModelSourceWithFallback('textBaseline');
        base.dropShadow = this.getModelSourceWithFallback('dropShadow');

        return base;
    }

    protected createRenderModel(): LabelEntityRenderModel {
        const { x, y, innerWidth, innerHeight } = layoutEngine.getLayoutDataFor(this);

        return {
            alpha: this.resolvedModel.alpha,
            rotation: this.resolvedModel.rotation,
            clip: this.resolvedModel.clip,
            renderableType: RenderableType.LABEL,
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
            text: this.resolvedModel.text,
            color: this.resolvedModel.color,
            dropShadowAngle: this.resolvedModel.dropShadowAngle,
            renderCharCount: this.resolvedModel.renderCharCount,
            stroke: this.resolvedModel.stroke,
            strokeThickness: this.resolvedModel.strokeThickness,
            fontSize: this.resolvedModel.fontSize,
            fontFamily: this.resolvedModel.fontFamily,
            fontStyle: this.resolvedModel.fontStyle,
            fontWeight: this.resolvedModel.fontWeight,
            dropShadowColor: this.resolvedModel.dropShadowColor,
            dropShadowDistance: this.resolvedModel.dropShadowDistance,
            dropShadowFuzziness: this.resolvedModel.dropShadowFuzziness,
            textBaseline: this.resolvedModel.textBaseline,
            dropShadow: this.resolvedModel.dropShadow
        };
    }
}
