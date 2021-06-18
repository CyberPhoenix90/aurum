import { Rectangle } from './rectangle';
import { PointLike } from '../../models/point';

export abstract class AbstractShape {
	public readonly position: PointLike;

	public get x() {
		return this.position.x;
	}

	public get y() {
		return this.position.y;
	}

	public set x(value: number) {
		this.position.x = value;
	}

	public set y(value: number) {
		this.position.y = value;
	}

	constructor(position: PointLike) {
		this.position = position;
	}

	public abstract getBoundingBox(): Rectangle;
}
