import { PointLike } from '../../models/point';
import { AbstractShape } from './abstract_shape';
import { Rectangle } from './rectangle';

export class Point extends AbstractShape {
	constructor(position: PointLike) {
		super(position);
	}

	public isEquivalentTo(p: Point): boolean {
		return this.position.x === p.position.x && this.position.y === p.position.y;
	}

	public getBoundingBox(): Rectangle {
		return new Rectangle(this.position, { x: 1, y: 1 });
	}
}
