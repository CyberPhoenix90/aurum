import { DataSource } from 'aurumjs';
import { Trait } from '../../core/entity';
import { Data } from '../../utilities/data';

export class Position2D extends Trait {
    public readonly x: Data<number>;
    public readonly y: Data<number>;

    constructor(x: Data<number> = new DataSource(0), y: Data<number> = new DataSource(0)) {
        super();
        this.x = x;
        this.y = y;
    }
}
