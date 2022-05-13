import { DataSource } from 'aurumjs';
import { inject, Trait } from '../../core/entity';
import { Data } from '../../utilities/data';
import { Position2D } from './position2d';

export class BoundingBox2D extends Trait {
    public width: Data<number>;
    public height: Data<number>;
    public get x(): Data<number> {
        return this.position.x;
    }
    public get y(): Data<number> {
        return this.position.y;
    }

    @inject(Position2D)
    private position: Position2D;

    constructor(width: Data<number> = new DataSource(0), height: Data<number> = new DataSource(0)) {
        super();
        this.width = width;
        this.height = height;
    }
}
