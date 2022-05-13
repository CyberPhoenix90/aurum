import { Aurum, Renderable } from 'aurumjs';
import { Entity, Trait, using } from '../../core/entity';
import { TextureReference } from '../../resources/texture_manager';
import { Data } from '../../utilities/data';
import { BoundingBox2D } from '../traits/bounding_box2D';
import { Name } from '../traits/name';
import { Position2D } from '../traits/position2d';
import { Scale2D } from '../traits/scale2D';
import { SpriteStyle, SpriteStyleModel } from '../traits/sprite_style';
import { Visible } from '../traits/visible';

export interface SpriteProps {
    name?: Data<string>;
    image: Data<TextureReference>;
    with?: Trait[];
    x?: Data<number>;
    y?: Data<number>;
    style?: SpriteStyleModel;
    scaleX?: Data<number>;
    scaleY?: Data<number>;
    visible?: Data<boolean>;
}

export function Sprite(props: SpriteProps): Renderable {
    using(
        new Position2D(props.x, props.y),
        new BoundingBox2D(),
        new Scale2D(props.scaleX, props.scaleY),
        new Visible(props.visible ?? true),
        new Name(props.name ?? 'Sprite'),
        new SpriteStyle(props.style)
    );

    if (props.with) {
        using(...props.with);
    }

    return <Entity />;
}
