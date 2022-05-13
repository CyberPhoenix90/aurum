import { PointLike } from 'aurum-layout-engine';
import { DataPointLike, readData } from '../utilities/data';

export const dataPointUtils = {
    distanceToSquared(point: DataPointLike, b: DataPointLike): number {
        return dataPointUtils.lengthSquared(dataPointUtils.pointDelta(point, b));
    },
    lengthSquared(point: DataPointLike): number {
        return readData(point.x) ** 2 + readData(point.y) ** 2;
    },
    pointDelta(point: DataPointLike, target: DataPointLike): PointLike {
        return { x: readData(target.x) - readData(point.x), y: readData(target.y) - readData(point.y) };
    },
    isEqual(a: DataPointLike, b: DataPointLike): boolean {
        return readData(a.x) === readData(b.x) && readData(a.y) === readData(b.y);
    }
};
