import { AbstractGridTool } from './abstract_tool';
import { PointLike } from 'aurum-layout-engine';
import { MouseButtons } from '../../../input/mouse/mouse';

export class GridLineTool extends AbstractGridTool {
    public onMouseMove(coordinates: PointLike, button: MouseButtons): void {
        const startX = this.startPosition.x;
        const startY = this.startPosition.y;
        const endX = coordinates.x;
        const endY = coordinates.y;

        let x = startX;
        let y = startY;

        let deltaX = endX - startX;
        let deltaY = endY - startY;

        this.config.onClearPreview();
        while (Math.floor(x) !== endX || Math.floor(y) !== endY) {
            this.config.onSetPreview({ x, y }, { x: 1, y: 1 }, button);
            if (Math.abs(x - endX) < Math.abs(deltaX) * 0.001) {
                x = endX;
            } else {
                x += deltaX * 0.001;
            }
            if (Math.abs(y - endY) < Math.abs(deltaY) * 0.001) {
                y = endY;
            } else {
                y += deltaY * 0.001;
            }
        }
    }

    public onMouseUp(coordinates: PointLike, button: MouseButtons): void {
        super.onMouseUp(coordinates, button);

        const startX = this.startPosition.x;
        const startY = this.startPosition.y;
        const endX = coordinates.x;
        const endY = coordinates.y;

        let x = startX;
        let y = startY;

        let deltaX = endX - startX;
        let deltaY = endY - startY;

        while (Math.floor(x) !== endX || Math.floor(y) !== endY) {
            this.config.onApply({ x, y }, { x: 1, y: 1 }, button);
            if (Math.abs(x - endX) < Math.abs(deltaX) * 0.001) {
                x = endX;
            } else {
                x += deltaX * 0.001;
            }
            if (Math.abs(y - endY) < Math.abs(deltaY) * 0.001) {
                y = endY;
            } else {
                y += deltaY * 0.001;
            }
        }
    }
}
