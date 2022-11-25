import { PointLike } from 'aurum-layout-engine';
import { AbstractShape } from './abstract_shape.js';
import { Rectangle } from './rectangle.js';

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
