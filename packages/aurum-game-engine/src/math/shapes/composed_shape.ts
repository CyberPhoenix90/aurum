import { CancellationToken } from 'aurumjs';
import { DataPointLike } from '../../utilities/data';
import { AbstractShape } from './abstract_shape';
import { Rectangle } from './rectangle';

export class ComposedShape extends AbstractShape {
    public readonly shapes: AbstractShape[];

    constructor(position: DataPointLike, shapes: AbstractShape[] = []) {
        super(position);
        this.shapes = shapes;
    }

    public getBoundingBox(): Rectangle {
        throw new Error('Method not implemented.');
    }

    public getBoundingBoxStream(lifeCycle: CancellationToken): Rectangle {
        throw new Error('Method not implemented.');
    }
}
