import { DataSource } from 'aurumjs';
import { Trait } from '../../core/entity';
import { Data } from '../../utilities/data';

export class Position3D extends Trait {
    public readonly x: Data<number>;
    public readonly y: Data<number>;
    public readonly z: Data<number>;

    constructor(x: Data<number> = new DataSource(0), y: Data<number> = new DataSource(0), z: Data<number> = new DataSource(0)) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
