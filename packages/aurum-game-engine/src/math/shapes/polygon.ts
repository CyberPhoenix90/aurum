import { AbstractShape } from './abstract_shape';
import { Rectangle } from './rectangle';
import { PointLike } from 'aurum-layout-engine';
import { DataPointLike } from '../../utilities/data';
import { dataPointUtils } from '../data_point_utils';
import { CancellationToken } from 'aurumjs';

export class Polygon extends AbstractShape {
    public points: DataPointLike[];

    constructor(position: PointLike, points: DataPointLike[]) {
        super(position);
        this.points = points;
    }

    public isEquivalentTo(p: Polygon): boolean {
        return (
            this.x === p.x &&
            this.y === p.y &&
            this.points.length === p.points.length &&
            this.points.every((point, i) => dataPointUtils.isEqual(point, p.points[i]))
        );
    }

    public getBoundingBox(): Rectangle {
        throw new Error('Method not implemented.');
    }

    public getBoundingBoxStream(lifeCycle: CancellationToken): Rectangle {
        throw new Error('Method not implemented.');
    }
}
