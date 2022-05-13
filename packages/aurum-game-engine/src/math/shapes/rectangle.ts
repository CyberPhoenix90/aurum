import { CancellationToken } from 'aurumjs';
import { DataPointLike, readData } from '../../utilities/data';
import { AbstractShape } from './abstract_shape';

export class Rectangle extends AbstractShape {
    public readonly size: DataPointLike;

    public get left(): number {
        return this.x;
    }

    public get top(): number {
        return this.y;
    }

    public get right(): number {
        return this.x + this.width;
    }

    public get bottom(): number {
        return this.y + this.height;
    }

    public get width(): number {
        return readData(this.size.x);
    }

    public get height(): number {
        return readData(this.size.y);
    }

    constructor(position: DataPointLike, size: DataPointLike) {
        super(position);
        this.size = size;
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
