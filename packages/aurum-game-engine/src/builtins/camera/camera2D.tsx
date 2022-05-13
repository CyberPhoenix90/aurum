import { Aurum, Renderable } from 'aurumjs';
import { Entity, Trait, using } from '../../core/entity';
import { Data } from '../../utilities/data';
import { BoundingBox2D } from '../traits/bounding_box2D';
import { Name } from '../traits/name';
import { Position2D } from '../traits/position2d';
import { Scale2D } from '../traits/scale2D';

export interface Camera2DProps {
    name?: Data<string>;
    with?: Trait[];
    x?: Data<number>;
    y?: Data<number>;
    width?: Data<number>;
    height?: Data<number>;
    scaleX?: Data<number>;
    scaleY?: Data<number>;
}

export function Camera2D(props: Camera2DProps): Renderable {
    using(
        new Position2D(props.x, props.y),
        new BoundingBox2D(props.width, props.height),
        new Scale2D(props.scaleX, props.scaleY),
        new Name(props.name ?? 'Camera2D')
    );

    if (props.with) {
        using(...props.with);
    }

    return <Entity></Entity>;
}
