import { PointLike } from 'aurum-layout-engine';
import { AbstractShape } from './abstract_shape.js';
import { Rectangle } from './rectangle.js';

export class RegularPolygon extends AbstractShape {
    public sides: number;
    public radius: number;

    constructor(position: PointLike, sides: number, radius: number) {
        super(position);
        this.sides = sides;
        this.radius = radius;
    }

    public isEquivalentTo(p: RegularPolygon): boolean {
        return this.position.x === p.position.x && this.position.y === p.position.y && this.sides === p.sides && this.radius === p.radius;
    }

    public getBoundingBox(): Rectangle {
        return new Rectangle(
            {
                x: this.position.x - this.radius,
                y: this.position.y - this.radius
            },
            { x: this.radius * 2, y: this.radius * 2 }
        );
    }
}
