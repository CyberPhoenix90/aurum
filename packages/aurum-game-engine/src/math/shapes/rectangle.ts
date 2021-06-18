import { AbstractShape } from './abstract_shape';
import { PointLike } from '../../models/point';

export class Rectangle extends AbstractShape {
	public size: PointLike;

	public get left(): number {
		return this.position.x;
	}

	public get top(): number {
		return this.position.y;
	}

	public get right(): number {
		return this.position.x + this.size.x;
	}

	public get bottom(): number {
		return this.position.y + this.size.y;
	}

	public get width(): number {
		return this.size.x;
	}

	public get height(): number {
		return this.size.y;
	}

	public set width(value: number) {
		this.size.x = value;
	}

	public set height(value: number) {
		this.size.y = value;
	}

	constructor(position: PointLike, size: PointLike) {
		super(position);
		this.size = size;
	}

	public clone(): Rectangle {
		return this.getBoundingBox();
	}

	public getBoundingBox(): Rectangle {
		return new Rectangle({ x: this.position.x, y: this.position.y }, { x: this.size.x, y: this.size.y });
	}
}
