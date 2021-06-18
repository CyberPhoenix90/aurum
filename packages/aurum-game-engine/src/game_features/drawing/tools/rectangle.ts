import { AbstractGridTool } from './abstract_tool';
import { PointLike } from '../../../models/point';
import { MouseButtons } from '../../../input/mouse/mouse';

export class RectangleTool extends AbstractGridTool {
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
		this.config.onSetPreview({ x: startX, y: startY }, { x: endX - startY, y: endY - startY }, button);

		this.startX = startX;
		this.startY = startY;
		this.width = endX - startX;
		this.height = endY - startY;
	}

	public onMouseUp(coordinates: PointLike, button: MouseButtons): void {
		super.onMouseUp(coordinates, button);

		const startX = this.startX;
		const startY = this.startY;
		const endX = this.startX + this.width;
		const endY = this.startY + this.height;

		let x = startX;
		let y = startY;

		for (x = startX; x < endX; x++) {
			this.config.onApply({ x, y }, { x: 1, y: 1 }, button);
		}

		x = startX;
		y = endY;

		for (x = startX; x < endX; x++) {
			this.config.onApply({ x, y }, { x: 1, y: 1 }, button);
		}

		x = startX;
		y = startY;

		for (y = startY; y <= endY; y++) {
			this.config.onApply({ x, y }, { x: 1, y: 1 }, button);
		}

		x = endX;
		y = startY;

		for (y = startY; y <= endY; y++) {
			this.config.onApply({ x, y }, { x: 1, y: 1 }, button);
		}
	}
}
