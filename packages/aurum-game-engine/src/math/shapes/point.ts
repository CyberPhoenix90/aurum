import { CancellationToken } from 'aurumjs';
import { DataPointLike } from '../../utilities/data';
import { AbstractShape } from './abstract_shape';
import { Rectangle } from './rectangle';

export class Point extends AbstractShape {
    constructor(position: DataPointLike) {
        super(position);
    }

    public isEquivalentTo(p: Point): boolean {
        return this.x === p.x && this.y === p.y;
    }

    public getBoundingBox(): Rectangle {
        return new Rectangle(this.position, { x: 1, y: 1 });
    }

    public getBoundingBoxStream(lifeCycle: CancellationToken): Rectangle {
        return new Rectangle(this.position, { x: 1, y: 1 });
    }
}
