import { CancellationToken } from 'aurumjs';
import { Trait } from '../../core/entity';
import { Color } from '../../graphics/color';
import { theme } from '../../graphics/theme';
import { Data } from '../../utilities/data';

export interface LabelStyleModel {
    font?: Data<string>;
    color?: Data<Color>;
    size?: Data<number>;
}

export class TextStyle extends Trait {
    public readonly font: Data<string>;
    public readonly size: Data<number>;
    public readonly color: Data<Color>;

    constructor(style: LabelStyleModel = {}) {
        super();
        this.font = style.font ?? theme.pick('defaultFont', CancellationToken.forever);
        this.size = style.size ?? theme.pick('defaultFontSize', CancellationToken.forever);
        this.color = style.color ?? theme.pick('defaultFontColor', CancellationToken.forever);
    }
}
