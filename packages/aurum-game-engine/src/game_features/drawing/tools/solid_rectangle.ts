import { AbstractGridTool } from './abstract_tool.js';
import { PointLike } from 'aurum-layout-engine';
import { MouseButtons } from '../../../input/mouse/mouse.js';

export class SolidRectangleGridTool extends AbstractGridTool {
    private startX: number;
    private startY: number;
    private width: number;
    private height: number;

    public onMouseMove(coordinates: PointLike, button: MouseButtons) {
        const startX = Math.min(this.startPosition.x, coordinates.x);
        const startY = Math.min(this.startPosition.y, coordinates.y);
        const endX = Math.max(this.startPosition.x, coordinates.x);
        const endY = Math.max(this.startPosition.y, coordinates.y);
        this.config.onClearPreview();

        this.config.onSetPreview({ x: startX, y: startY }, { x: endX - startX + 1, y: endY - startY + 1 }, button);

        this.startX = startX;
        this.startY = startY;
        this.width = endX - startX + 1;
        this.height = endY - startY + 1;
    }

    public onMouseUp(coordinates: PointLike, button: MouseButtons): void {
        super.onMouseUp(coordinates, button);

        const startX = this.startX;
        const startY = this.startY;
        const endX = this.startX + this.width;
        const endY = this.startY + this.height;

        let x = startX;
        let y = startY;

        this.config.onApply({ x, y }, { x: endX - startX + 1, y: endY - startY + 1 }, button);
    }
}
