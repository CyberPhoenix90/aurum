import { AbstractShape } from './abstract_shape';
import { Rectangle } from './rectangle';
import { Vector2D } from '../vectors/vector2d';

export class ComposedShape extends AbstractShape {
	public readonly shapes: AbstractShape[];

	constructor(position: Vector2D, shapes: AbstractShape[] = []) {
		super(position);
		this.shapes = shapes;
	}

	public getBoundingBox(): Rectangle {
		return new Rectangle(
			this.position,
			new Vector2D(
				Math.max(...this.shapes.map((e) => e.getBoundingBox().right - this.position.x)),
				Math.max(...this.shapes.map((e) => e.getBoundingBox().bottom - this.position.y))
			)
		);
	}
}
