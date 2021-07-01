import { ReactivePointLike } from 'aurum-layout-engine';
import { Rectangle } from '../shapes/rectangle';
import { AbstractReactiveShape } from './abstract_reactive_shape';

export class ReactiveRectangle extends AbstractReactiveShape {
    public size: ReactivePointLike;

    public get left(): number {
        return this.position.x.value;
    }

    public get top(): number {
        return this.position.y.value;
    }

    public get right(): number {
        return this.position.x.value + this.size.x.value;
    }

    public get bottom(): number {
        return this.position.y.value + this.size.y.value;
    }

    public get width(): number {
        return this.size.x.value;
    }

    public get height(): number {
        return this.size.y.value;
    }

    constructor(position: ReactivePointLike, size: ReactivePointLike) {
        super(position);
        this.size = size;
    }

    public clone(): ReactiveRectangle {
        return this.getReactiveBoundingBox();
    }

    public toStatic(): Rectangle {
        return this.getStaticBoundingBox();
    }

    public getStaticBoundingBox(): Rectangle {
        return new Rectangle({ x: this.position.x.value, y: this.position.y.value }, { x: this.size.x.value, y: this.size.y.value });
    }

    public getReactiveBoundingBox(): ReactiveRectangle {
        return new ReactiveRectangle({ x: this.position.x, y: this.position.y }, { x: this.size.x, y: this.size.y });
    }
}
