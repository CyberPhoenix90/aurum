import { Rectangle } from './rectangle.js';
import { PointLike } from 'aurum-layout-engine';

export abstract class AbstractShape {
    public readonly position: PointLike;

    public get x() {
        return this.position.x;
    }

    public get y() {
        return this.position.y;
    }

    public set x(value: number) {
        this.position.x = value;
    }

    public set y(value: number) {
        this.position.y = value;
    }

    constructor(position: PointLike) {
        this.position = position;
    }

    public abstract getBoundingBox(): Rectangle;
}
