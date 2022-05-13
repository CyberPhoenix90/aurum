import { Aurum, Renderable } from 'aurumjs';
import { Entity, Trait, using } from '../../core/entity';
import { Data } from '../../utilities/data';
import { BoundingBox2D } from '../traits/bounding_box2D';
import { Name } from '../traits/name';
import { Position2D } from '../traits/position2d';
import { Scale2D } from '../traits/scale2D';
import { Text } from '../traits/text';
import { LabelStyleModel, TextStyle } from '../traits/text_style';
import { Visible } from '../traits/visible';

export interface LabelProps {
    name?: Data<string>;
    text: Data<string>;
    with?: Trait[];
    x?: Data<number>;
    y?: Data<number>;
    style?: LabelStyleModel;
    scaleX?: Data<number>;
    scaleY?: Data<number>;
    visible?: Data<boolean>;
}

export function Label(props: LabelProps): Renderable {
    using(
        new Position2D(props.x, props.y),
        new BoundingBox2D(),
        new Scale2D(props.scaleX, props.scaleY),
        new Text(props.text),
        new Visible(props.visible ?? true),
        new Name(props.name ?? 'Label'),
        new TextStyle(props.style)
    );

    if (props.with) {
        using(...props.with);
    }

    return <Entity />;
}
