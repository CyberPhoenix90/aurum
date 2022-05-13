import { DataSource } from 'aurumjs';
import { Trait } from '../../core/entity';
import { Color } from '../../graphics/color';
import { Data } from '../../utilities/data';

export interface SpriteStyleModel {
    width?: Data<number | 'auto'>;
    height?: Data<number | 'auto'>;
    offsetX?: Data<number>;
    offsetY?: Data<number>;
    flip?: Data<boolean>;
    rotation?: Data<number>;
    scaleX?: Data<number>;
    scaleY?: Data<number>;
    tint?: Data<Color>;
}

export class SpriteStyle extends Trait {
    public readonly width: Data<number | 'auto'>;
    public readonly height: Data<number | 'auto'>;
    public readonly offsetX: Data<number>;
    public readonly offsetY: Data<number>;
    public readonly flip: Data<boolean>;
    public readonly rotation: Data<number>;
    public readonly scaleX: Data<number>;
    public readonly scaleY: Data<number>;
    public readonly tint: Data<Color>;

    constructor(style: SpriteStyleModel = {}) {
        super();
        this.width = style.width ?? new DataSource('auto');
        this.height = style.height ?? new DataSource('auto');
        this.offsetX = style.offsetX ?? new DataSource(0);
        this.flip = style.flip ?? new DataSource(false);
        this.rotation = style.rotation ?? new DataSource(0);
        this.scaleX = style.scaleX ?? new DataSource(1);
        this.scaleY = style.scaleY ?? new DataSource(1);
        this.tint = style.tint ?? new DataSource(Color.WHITE);
    }
}
