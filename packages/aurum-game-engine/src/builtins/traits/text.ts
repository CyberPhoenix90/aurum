import { Trait } from '../../core/entity';
import { Data } from '../../utilities/data';

export class Text extends Trait {
    public readonly text: Data<string>;

    constructor(text: Data<string>) {
        super();
        this.text = text;
    }
}
