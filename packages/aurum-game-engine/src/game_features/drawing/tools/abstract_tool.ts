import { PointLike } from 'aurum-layout-engine';
import { MouseButtons } from '../../../input/mouse/mouse.js';

export interface AbstractGridToolConfig {
    onClearPreview();
    onSetPreview(coordinates: PointLike, size: PointLike, button: MouseButtons);
    onApply(coordinates: PointLike, size: PointLike, button: MouseButtons);
}

export abstract class AbstractGridTool {
    public mouseDown: boolean;
    protected startPosition: { x: number; y: number };
    protected config: AbstractGridToolConfig;

    constructor(config: AbstractGridToolConfig) {
        this.mouseDown = false;
    }

    public onMouseDown(coordinates: PointLike, button: MouseButtons) {
        this.mouseDown = true;
        this.startPosition = coordinates;
    }

    public onMouseUp(coordinates: PointLike, button: MouseButtons) {
        this.mouseDown = false;
    }

    public onMouseMove(coordinates: PointLike, button: MouseButtons) {}
}
