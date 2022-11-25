import { ReactivePointLike } from 'aurum-layout-engine';
import { Rectangle } from '../shapes/rectangle.js';
import { ReactiveRectangle } from './reactive_rectangle.js';

export abstract class AbstractReactiveShape {
    public readonly position: ReactivePointLike;

    public get x() {
        return this.position.x.value;
    }

    public get y() {
        return this.position.y.value;
    }

    constructor(position: ReactivePointLike) {
        this.position = position;
    }

    public abstract getStaticBoundingBox(): Rectangle;

    public abstract getReactiveBoundingBox(): ReactiveRectangle;
}
