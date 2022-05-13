import { DataSource } from 'aurumjs';
import { Trait } from '../../core/entity';
import { Data } from '../../utilities/data';

export class Scale2D extends Trait {
    public readonly scaleX: Data<number>;
    public readonly scaleY: Data<number>;

    constructor(scaleX: Data<number> = new DataSource(1), scaleY: Data<number> = new DataSource(1)) {
        super();
        this.scaleX = scaleX;
        this.scaleY = scaleY;
    }
}
