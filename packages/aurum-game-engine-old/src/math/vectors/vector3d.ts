import { AbstractVector } from './abstract_vector';
import { Vector2D } from './vector2d';

export class Vector3D extends AbstractVector {
	public get x(): number {
		return this.memory[0];
	}

	public get y(): number {
		return this.memory[1];
	}

	public get z(): number {
		return this.memory[2];
	}

	public set x(value: number) {
		this.memory[0] = value;
	}

	public set y(value: number) {
		this.memory[1] = value;
	}

	public set z(value: number) {
		this.memory[2] = value;
	}

	constructor(x: number, y: number, z: number) {
		super([x, y, z]);
	}

	public xy(): Vector2D {
		return new Vector2D(this.x, this.y);
	}

	public xz(): Vector2D {
		return new Vector2D(this.x, this.z);
	}

	public yz(): Vector2D {
		return new Vector2D(this.y, this.z);
	}

	public yx(): Vector2D {
		return new Vector2D(this.y, this.x);
	}

	public zx(): Vector2D {
		return new Vector2D(this.z, this.x);
	}

	public zy(): Vector2D {
		return new Vector2D(this.z, this.y);
	}

	public length() {
		return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
	}

	public componentWiseMul(v: Vector3D): this {
		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;

		return this;
	}

	public componentWiseDiv(v: Vector3D): this {
		this.x /= v.x;
		this.y /= v.y;
		this.z /= v.z;

		return this;
	}

	public clone(): Vector3D {
		return new Vector3D(this.memory[0], this.memory[1], this.memory[2]);
	}

	public isEqual(v: Vector3D): boolean {
		return this.x === v.x && this.y === v.y && this.z === v.z;
	}
}
