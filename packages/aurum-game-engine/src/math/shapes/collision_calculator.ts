import { Constructor, MapLike } from '../../models/common';
import { PointLike } from '../../models/point';
import { pointUtils } from '../vectors/point_utils';
import { AbstractShape } from './abstract_shape';
import { Circle } from './circle';
import { ComposedShape } from './composed_shape';
import { Point } from './point';
import { Rectangle } from './rectangle';

export class CollisionCalculator {
	private collisionCheckMap: MapLike<(a: AbstractShape, b: AbstractShape) => boolean>;

	constructor() {
		this.collisionCheckMap = {};
		this.addCollisionPair(Rectangle, Rectangle, this.isRectangleOverlappingRectangle);

		this.addCollisionPair(Circle, Circle, this.isCircleOverlappingCircle);
		this.addCollisionPair(Circle, Rectangle, this.isCirleOverlappingRectangle);

		this.addCollisionPair(Point, Point, this.isPointOverlappingPoint);
		this.addCollisionPair(Point, Rectangle, this.isPointOverlappingRectangle);
		this.addCollisionPair(Point, Circle, this.isPointOverlappingCircle);

		this.addCollisionPair(ComposedShape, ComposedShape, this.isShapeOverlappingComposedShape);
		this.addCollisionPair(Point, ComposedShape, this.isShapeOverlappingComposedShape);
		this.addCollisionPair(Rectangle, ComposedShape, this.isShapeOverlappingComposedShape);
		this.addCollisionPair(Circle, ComposedShape, this.isShapeOverlappingComposedShape);
	}

	public isShapeOverlappingComposedShape(shape: AbstractShape, composedShape: ComposedShape): boolean {
		let found: boolean = false;
		for (const s of composedShape.shapes) {
			s.position.x += composedShape.position.x;
			s.position.y += composedShape.position.y;

			if (this.isOverlapping(shape, s)) {
				found = true;
			}

			s.position.x -= composedShape.position.x;
			s.position.y -= composedShape.position.y;
			if (found) {
				return true;
			}
		}

		return false;
	}

	private addCollisionPair(a: Constructor<AbstractShape>, b: Constructor<AbstractShape>, checker: (a: any, b: any) => boolean): void {
		this.collisionCheckMap[a.name + b.name] = checker.bind(this);

		if (a !== b) {
			this.collisionCheckMap[b.name + a.name] = (a, b) => checker.call(this, b, a);
		}
	}

	public isPointOverlappingRectangle(a: PointLike, b: Rectangle): boolean {
		return a.x >= b.x && a.x <= b.x + b.width && a.y >= b.y && a.y <= b.y + b.height;
	}

	public isPointOverlappingCircle(a: Point, b: Circle): boolean {
		return pointUtils.distanceToSquared(a.position, b.position) < b.radius ** 2;
	}

	public isCircleOverlappingCircle(a: Circle, b: Circle): boolean {
		return pointUtils.distanceToSquared(a.position, b.position) < (a.radius + b.radius) ** 2;
	}

	public isCirleOverlappingRectangle(a: Circle, b: Rectangle): boolean {
		const distX: number = Math.abs(a.x - b.x - b.width / 2);
		const distY: number = Math.abs(a.y - b.y - b.height / 2);

		if (distX > b.width / 2 + a.radius) {
			return false;
		}
		if (distY > b.height / 2 + a.radius) {
			return false;
		}

		if (distX <= b.width / 2) {
			return true;
		}
		if (distY <= b.height / 2) {
			return true;
		}

		const dx: number = distX - b.width / 2;
		const dy: number = distY - b.height / 2;
		return dx * dx + dy * dy <= a.radius * a.radius;
	}

	public isPointOverlappingPoint(a: Point, b: Point): boolean {
		return a.isEquivalentTo(b);
	}

	public isOverlapping(a: AbstractShape, b: AbstractShape): boolean {
		const call: (a: AbstractShape, b: AbstractShape) => boolean = this.collisionCheckMap[
			Object.getPrototypeOf(a).constructor.name + Object.getPrototypeOf(b).constructor.name
		];

		if (call === undefined) {
			throw new Error('no collision checking logic implemented for shape pair');
		}

		return call(a, b);
	}

	public isRectangleOverlappingRectangle(a: Rectangle, b: Rectangle): boolean {
		return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
	}
}

export const collisionCalculator: CollisionCalculator = new CollisionCalculator();
