import { CancellationToken } from 'aurumjs';
import { Data, DataPointLike, mulConst, readData, sumReduce, tx } from '../../utilities/data';
import { AbstractShape } from './abstract_shape';
import { Rectangle } from './rectangle';

export class Circle extends AbstractShape {
    public radius: Data<number>;

    public getCenter(lifeCycle: CancellationToken): DataPointLike {
        return { x: tx(lifeCycle, [this.position.x, this.radius], sumReduce), y: tx(lifeCycle, [this.position.y, this.radius], sumReduce) };
    }

    constructor(position: DataPointLike, radius: number) {
        super(position);
        this.radius = radius;
    }

    public getBoundingBox(): Rectangle {
        return new Rectangle(
            {
                x: readData(this.position.x),
                y: readData(this.position.y)
            },
            {
                x: readData(this.radius) * 2,
                y: readData(this.radius) * 2
            }
        );
    }

    public getBoundingBoxStream(lifeCycle: CancellationToken): Rectangle {
        return new Rectangle(this.position, {
            x: tx(lifeCycle, this.radius, mulConst(2)),
            y: tx(lifeCycle, this.radius, mulConst(2))
        });
    }
}
