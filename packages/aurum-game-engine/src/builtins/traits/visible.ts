import { DataSource } from 'aurumjs';
import { Trait } from '../../core/entity';
import { Data } from '../../utilities/data';

export class Visible extends Trait {
    public readonly visible: Data<boolean>;

    constructor(visible: Data<boolean> = new DataSource(true)) {
        super();
        this.visible = visible;
    }
}
