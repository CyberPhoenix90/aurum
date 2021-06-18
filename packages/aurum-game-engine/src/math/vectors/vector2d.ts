import { AbstractVector } from './abstract_vector';
import { PointLike } from '../../models/point';
import { Radian } from '../../models/common';

/**
 * Extension of point, used for vector based math
 */

export class Vector2D extends AbstractVector {
	get x() {
		return this.memory[0];
	}

	get y() {
		return this.memory[1];
	}

	set x(value: number) {
		this.memory[0] = value;
	}

	set y(value: number) {
		this.memory[1] = value;
	}

	constructor(x: number = 0, y: number = 0) {
		super([x, y]);
	}

	/**
	 * Returns an identical copy of the object
	 * @returns {Vector2D}
	 */
	public clone(): Vector2D {
		return new Vector2D(this.x, this.y);
	}

	/**
	 * Sums 2 vectors, adds the x and y value of the second vector to this
	 * @param vector
	 * @returns {Vector2D}
	 */
	public add(vector: PointLike): this {
		this.x += vector.x;
		this.y += vector.y;
		return this;
	}

	public flipX(): this {
		this.x *= -1;
		return this;
	}

	public flipY(): this {
		this.y *= -1;
		return this;
	}

	public toString() {
		return `{"x":${this.x},"y":${this.y}}`;
	}

	/**
	 * Subtracts 2 vectors, subtracts x and y value of the second vector to this
	 * @param vector
	 * @returns {Vector2D}
	 */
	public sub(vector: PointLike): this {
		this.x -= vector.x;
		this.y -= vector.y;
		return this;
	}

	public componentWiseMultiplication(target: PointLike): this {
		this.x *= target.x;
		this.y *= target.y;

		return this;
	}

	public componentWiseDivision(target: PointLike): this {
		this.x /= target.x;
		this.y /= target.y;

		return this;
	}

	public isEqual(v: PointLike): boolean {
		return this.x === v.x && this.y === v.y;
	}

	/**
	 * alternative constructor returns a 0,0 vector
	 * @returns {Vector2D}
	 */
	public static zero(): Vector2D {
		return new Vector2D(0, 0);
	}

	public static fromPointLike(PointLike: PointLike): Vector2D {
		return new Vector2D(PointLike.x, PointLike.y);
	}

	public setPolarCoordinates(length: number, angle: number): this {
		this.set(length * Math.cos(angle), length * Math.sin(angle));
		return this;
	}

	public static fromPolarCoordinates(length: number, angle: number): Vector2D {
		return Vector2D.zero().setPolarCoordinates(length, angle);
	}

	public static createConnectingVector(source: PointLike, target: PointLike): Vector2D {
		return new Vector2D(target.x - source.x, target.y - source.y);
	}

	public static fromString(text: string): Vector2D | undefined {
		const segments: string[] = text.split(' ');
		if (segments.length === 2) {
			return new Vector2D(parseFloat(segments[0]), parseFloat(segments[1]));
		} else if (segments.length === 1) {
			return new Vector2D(parseFloat(segments[0]), parseFloat(segments[0]));
		} else {
			return undefined;
		}
	}

	public set(x: number, y: number): this {
		this.x = x;
		this.y = y;

		return this;
	}

	public copy(dataSource: { x: number; y: number }): this {
		this.x = dataSource.x;
		this.y = dataSource.y;

		return this;
	}

	public merge(dataSource: { x: number; y: number }): this {
		return this.copy(dataSource);
	}

	public moveBy(x: number, y: number): this {
		this.x += x;
		this.y += y;

		return this;
	}

	public connectingVector(b: PointLike): Vector2D {
		return this.clone()
			.flip()
			.add(b);
	}

	/**
	 * Euclidean distance
	 */
	public distanceTo(b: PointLike): number {
		return this.connectingVector(b).length();
	}

	/**
	 * Unlike euclidean distance this counts the steps from one position to another, this results in longer diagonals
	 */
	public manhattanDistance(b: PointLike): number {
		const con = this.connectingVector(b);
		return Math.abs(this.x - con.x) + Math.abs(this.y - con.y);
	}

	public distanceToSquared(b: PointLike): number {
		return this.connectingVector(b).lengthSquared();
	}

	public componentWiseClamp(minX, maxX, minY, maxY): Vector2D {
		this.x = Math.max(Math.min(this.x, maxX), minX);
		this.y = Math.max(Math.min(this.y, maxY), minY);

		return this;
	}

	public getAngle(): number {
		return Math.atan2(this.y, this.x);
	}

	public rotateBy(angle: Radian): void {
		this.setAngle(this.getAngle() + angle);
	}

	public setAngle(angle: Radian): void {
		this.setPolarCoordinates(this.length(), angle);
	}

	public length() {
		return Math.sqrt(this.x ** 2 + this.y ** 2);
	}

	public ratio(): number {
		return this.x / this.y;
	}

	public toJson(): { x: number; y: number } {
		return {
			x: this.x,
			y: this.y
		};
	}

	public static fromJson(data: { x: number; y: number }): Vector2D {
		return new Vector2D(data.x, data.y);
	}
}
