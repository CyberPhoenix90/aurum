import { AbstractGridTool } from './abstract_tool.js';
import { PointLike } from 'aurum-layout-engine';
import { MouseButtons } from '../../../input/mouse/mouse.js';

export class GridPencilTool extends AbstractGridTool {
    public onMouseDown(coordinates: PointLike, button: MouseButtons) {
        super.onMouseDown(coordinates, button);
        this.config.onApply(coordinates, { x: 1, y: 1 }, button);
    }

    public onMouseMove(coordinates: PointLike, button: MouseButtons) {
        if (this.mouseDown) {
            this.config.onApply(coordinates, { x: 1, y: 1 }, button);
        }
    }
}
