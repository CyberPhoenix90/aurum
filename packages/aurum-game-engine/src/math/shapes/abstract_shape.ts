import { CancellationToken } from 'aurumjs';
import { DataPointLike, readData } from '../../utilities/data';
import { Rectangle } from './rectangle';

export abstract class AbstractShape {
    public readonly position: DataPointLike;

    public get x() {
        return readData(this.position.x);
    }

    public get y() {
        return readData(this.position.y);
    }

    constructor(position: DataPointLike) {
        this.position = position;
    }

    public abstract getBoundingBox(): Rectangle;
    public abstract getBoundingBoxStream(lifeCycle: CancellationToken): Rectangle;
}
