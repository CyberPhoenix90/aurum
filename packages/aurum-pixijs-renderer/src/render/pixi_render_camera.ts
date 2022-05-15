import { CameraGraphNode, Color } from 'aurum-game-engine';
import { AbstractRenderer, autoDetectRenderer, DisplayObject } from 'pixi.js';
import { NoRenderEntity } from './pixi_no_render_entity';

export class RenderCameraEntity extends NoRenderEntity {
    private readonly renderer: AbstractRenderer;
    private view: HTMLCanvasElement;

    constructor(model: CameraGraphNode, stageNode: HTMLElement) {
        super(model);
        this.model = model;
        const view: HTMLCanvasElement = document.createElement('canvas');
        model.renderState.view = view;
        view.width = model.resolvedModel.resolutionX.value ?? model.renderState.width.value;
        view.height = model.resolvedModel.resolutionY.value ?? model.renderState.height.value;
        stageNode.appendChild(view);

        this.renderer = autoDetectRenderer({
            view: view,
            backgroundColor: Color.fromString(model.renderState.backgroundColor.value || '#000000').toRGBNumber()
        });

        this.view = view;

        const { resolutionX, resolutionY } = model.resolvedModel;
        resolutionX.aggregate([resolutionY, model.renderState.width, model.renderState.height], (resolutionX, resolutionY, width, height) => {
            const effectivewidth = resolutionX ?? width;
            const effectiveheight = resolutionY ?? height;

            if (this.renderer.view.width !== effectivewidth || this.renderer.view.height !== effectiveheight) {
                this.renderer.resize(effectivewidth, effectiveheight);
            }
            this.renderer.view.style.width = `${width}px`;
            this.renderer.view.style.height = `${height}px`;
        });
        this.renderer.view.style.width = `${model.renderState.width.value}px`;
        this.renderer.view.style.height = `${model.renderState.height.value}px`;
    }

    public renderView(node: DisplayObject) {
        //@ts-ignore
        this.view.node = node;
        this.renderer.render(node);
    }
}
