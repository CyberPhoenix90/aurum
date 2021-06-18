import { PointLike } from '../../models/point';
import { Rectangle } from './rectangle';

export class RoundedRectangle extends Rectangle {
	public radius: number;

	constructor(position: PointLike, size: PointLike, radius: number) {
		super(position, size);
		this.radius = radius;
	}

	public clone(): RoundedRectangle {
		return new RoundedRectangle({ x: this.x, y: this.y }, { x: this.size.x, y: this.size.y }, this.radius);
	}

	public getBoundingBox(): Rectangle {
		return new Rectangle({ x: this.position.x, y: this.position.y }, { x: this.size.x, y: this.size.y });
	}
}
