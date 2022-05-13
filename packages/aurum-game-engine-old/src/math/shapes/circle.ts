import { AbstractShape } from './abstract_shape';
import { Rectangle } from './rectangle';
import { Vector2D } from '../vectors/vector2d';

export class Circle extends AbstractShape {
	public radius: number;

	public get center(): Vector2D {
		return new Vector2D(this.position.x + this.radius, this.position.y + this.radius);
	}

	constructor(position: Vector2D, radius: number) {
		super(position);
		this.radius = radius;
	}

	public getBoundingBox(): Rectangle {
		return new Rectangle({ x: this.position.x, y: this.position.y }, new Vector2D(this.radius * 2, this.radius * 2));
	}
}
