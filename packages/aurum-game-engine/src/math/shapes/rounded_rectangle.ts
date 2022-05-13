import { PointLike } from 'aurum-layout-engine';
import { CancellationToken } from 'aurumjs';
import { readData } from '../../utilities/data';
import { Rectangle } from './rectangle';

export class RoundedRectangle extends Rectangle {
    public radius: number;

    constructor(position: PointLike, size: PointLike, radius: number) {
        super(position, size);
        this.radius = radius;
    }

    public clone(): Rectangle {
        return this.getBoundingBox();
    }

    public getBoundingBox(): Rectangle {
        return new Rectangle({ x: readData(this.position.x), y: readData(this.position.y) }, { x: readData(this.size.x), y: readData(this.size.y) });
    }

    public getBoundingBoxStream(lifeCycleToken: CancellationToken): Rectangle {
        return new Rectangle({ x: this.position.x, y: this.position.y }, { x: this.size.x, y: this.size.y });
    }
}
