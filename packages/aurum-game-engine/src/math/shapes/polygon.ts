import { AbstractShape } from './abstract_shape';
import { Rectangle } from './rectangle';
import { Vector2D } from '../vectors/vector2d';
import { PointLike } from 'aurum-layout-engine';

export class Polygon extends AbstractShape {
    public points: Vector2D[];

    constructor(position: PointLike, points: Vector2D[]) {
        super(position);
        this.points = points;
    }

    public isEquivalentTo(p: Polygon): boolean {
        return (
            this.position.x === p.position.x &&
            this.position.y === p.position.y &&
            this.points.length === p.points.length &&
            this.points.every((point, i) => point.isEqual(p.points[i]))
        );
    }

    public getBoundingBox(): Rectangle {
        return new Rectangle(this.position, { x: 1, y: 1 });
    }
}
