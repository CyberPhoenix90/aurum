import { Radian } from './model';
import { PointLike } from './point';

export const pointUtils = {
    clone(point: PointLike): PointLike {
        return { x: point.x, y: point.y };
    },
    add(point: PointLike, add: PointLike): PointLike {
        point.x += add.x;
        point.y += add.y;
        return point;
    },
    sub(point: PointLike, sub: PointLike): PointLike {
        point.x -= sub.x;
        point.y -= sub.y;
        return point;
    },
    componentWiseMultiplication(point: PointLike, mul: PointLike): PointLike {
        point.x *= mul.x;
        point.y *= mul.y;
        return point;
    },
    componentWiseDivision(point: PointLike, div: PointLike): PointLike {
        point.x /= div.x;
        point.y /= div.y;
        return point;
    },
    inverse(point: PointLike): PointLike {
        point.x = 1 / point.x;
        point.y = 1 / point.y;
        return point;
    },
    flip(point: PointLike): PointLike {
        return pointUtils.mul(point, -1);
    },
    flipX(point: PointLike): PointLike {
        point.x *= -1;
        return point;
    },
    flipY(point: PointLike): PointLike {
        point.y *= -1;
        return point;
    },
    isEqual(point: PointLike, v: PointLike): boolean {
        return point.x === v.x && point.y === v.y;
    },
    zero(): PointLike {
        return { x: 0, y: 0 };
    },
    addScalar(point: PointLike, scalar: number): PointLike {
        point.x = point.x + scalar;
        point.y = point.y + scalar;
        return point;
    },
    subScalar(point: PointLike, scalar: number): PointLike {
        point.x = point.x - scalar;
        point.y = point.y - scalar;
        return point;
    },
    div(point: PointLike, scalar: number): PointLike {
        point.x = point.x / scalar;
        point.y = point.y / scalar;
        return point;
    },
    mul(point: PointLike, scalar: number): PointLike {
        point.x = point.x * scalar;
        point.y = point.y * scalar;
        return point;
    },
    fromPolarCoordinates(length: number, angle: number): PointLike {
        return { x: length * Math.cos(angle), y: length * Math.sin(angle) };
    },
    setPolarCoordinates(point: PointLike, length: number, angle: number): PointLike {
        point.x = length * Math.cos(angle);
        point.y = length * Math.sin(angle);
        return point;
    },
    pointDelta(point: PointLike, target: PointLike): PointLike {
        return { x: target.x - point.x, y: target.y - point.y };
    },
    set(point: PointLike, x: number, y: number): PointLike {
        point.x = x;
        point.y = y;
        return point;
    },
    merge(point: PointLike, source: PointLike): PointLike {
        point.x = source.x;
        point.y = source.y;
        return point;
    },
    moveBy(point: PointLike, x: number, y: number): PointLike {
        point.x += x;
        point.y += y;

        return point;
    },
    distanceTo(point: PointLike, b: PointLike): number {
        return pointUtils.length(pointUtils.pointDelta(point, b));
    },

    manhattanDistance(point: PointLike, b: PointLike): number {
        const con = pointUtils.pointDelta(point, b);
        return Math.abs(point.x - con.x) + Math.abs(point.y - con.y);
    },
    distanceToSquared(point: PointLike, b: PointLike): number {
        return pointUtils.lengthSquared(pointUtils.pointDelta(point, b));
    },
    componentWiseClamp(point: PointLike, minX: number, maxX: number, minY: number, maxY: number): PointLike {
        point.x = Math.max(Math.min(point.x, maxX), minX);
        point.y = Math.max(Math.min(point.y, maxY), minY);

        return point;
    },
    getAngle(point: PointLike): number {
        return Math.atan2(point.y, point.x);
    },
    rotateBy(point: PointLike, angle: Radian): PointLike {
        pointUtils.setAngle(point, pointUtils.getAngle(point) + angle);
        return point;
    },
    setAngle(point: PointLike, angle: Radian): PointLike {
        pointUtils.setPolarCoordinates(point, pointUtils.length(point), angle);
        return point;
    },
    length(point: PointLike): number {
        return Math.sqrt(point.x ** 2 + point.y ** 2);
    },
    lengthSquared(point: PointLike): number {
        return point.x ** 2 + point.y ** 2;
    },
    ratio(point: PointLike): number {
        return point.x / point.y;
    }
};
