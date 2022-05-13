import { CancellationToken } from 'aurumjs';
import { inject, Trait } from '../../core/entity';
import { AbstractShape } from '../../math/shapes/abstract_shape';
import { Data, pipeData, syncDataDuplex } from '../../utilities/data';
import { Position2D } from './position2d';

export class Shape2D extends Trait {
    public readonly shape: Data<AbstractShape>;

    @inject(Position2D)
    private position: Position2D;

    constructor(shape: Data<AbstractShape>) {
        super();
        this.shape = shape;
    }

    public setup(lifeCycleToken: CancellationToken): void {
        pipeData(
            this.shape,
            (shape, valueLifetimeToken) => {
                syncDataDuplex(this.position.x, shape.position.x, CancellationToken.fromMultiple([valueLifetimeToken, lifeCycleToken]));
                syncDataDuplex(this.position.y, shape.position.y, CancellationToken.fromMultiple([valueLifetimeToken, lifeCycleToken]));
            },
            lifeCycleToken
        );
    }
}
