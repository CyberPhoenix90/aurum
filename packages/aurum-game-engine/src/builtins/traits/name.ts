import { Trait } from '../../core/entity';
import { Data } from '../../utilities/data';

export class Name extends Trait {
    public readonly name: Data<string>;

    constructor(name: Data<string>) {
        super();
        this.name = name;
    }
}
