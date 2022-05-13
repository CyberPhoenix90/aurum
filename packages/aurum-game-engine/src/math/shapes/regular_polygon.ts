import { PointLike } from 'aurum-layout-engine';
import { CancellationToken } from 'aurumjs';
import { Data, mulConst, readData, tx } from '../../utilities/data';
import { AbstractShape } from './abstract_shape';
import { Rectangle } from './rectangle';

export class RegularPolygon extends AbstractShape {
    public sides: Data<number>;
    public radius: Data<number>;

    constructor(position: PointLike, sides: number, radius: number) {
        super(position);
        this.sides = sides;
        this.radius = radius;
    }

    public isEquivalentTo(p: RegularPolygon): boolean {
        return this.x === p.x && this.y === p.y && readData(this.sides) === readData(p.sides) && readData(this.radius) === readData(p.radius);
    }

    public getBoundingBox(): Rectangle {
        return new Rectangle(
            {
                x: this.x - readData(this.radius),
                y: this.y - readData(this.radius)
            },
            { x: readData(this.radius) * 2, y: readData(this.radius) * 2 }
        );
    }

    public getBoundingBoxStream(lifeCycle: CancellationToken): Rectangle {
        return new Rectangle(this.position, {
            x: tx(lifeCycle, this.radius, mulConst(2)),
            y: tx(lifeCycle, this.radius, mulConst(2))
        });
    }
}
