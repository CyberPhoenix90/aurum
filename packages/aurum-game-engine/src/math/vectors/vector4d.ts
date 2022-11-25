import { AbstractVector } from './abstract_vector.js';
import { Vector2D } from './vector2d.js';

export class Vector4D extends AbstractVector {
    public get x(): number {
        return this.memory[0];
    }

    public get y(): number {
        return this.memory[1];
    }

    public get z(): number {
        return this.memory[2];
    }

    public get w(): number {
        return this.memory[3];
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

    public set w(value: number) {
        this.memory[3] = value;
    }

    constructor(x: number, y: number, z: number, w: number) {
        super([x, y, z, w]);
    }

    public clone(): Vector4D {
        return new Vector4D(this.memory[0], this.memory[1], this.memory[2], this.memory[3]);
    }

    public isEqual(v: Vector4D): boolean {
        return this.x === v.x && this.y === v.y && this.z === v.z && this.w === v.w;
    }

    public merge(dataSource: { x: number; y: number; z: number; w: number }): this {
        return this.copy(dataSource);
    }

    public copy(dataSource: { x: number; y: number; z: number; w: number }): this {
        this.x = dataSource.x;
        this.y = dataSource.y;
        this.z = dataSource.z;
        this.w = dataSource.w;

        return this;
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

    public xw(): Vector2D {
        return new Vector2D(this.x, this.w);
    }

    public wx(): Vector2D {
        return new Vector2D(this.w, this.x);
    }

    public yw(): Vector2D {
        return new Vector2D(this.y, this.w);
    }

    public wy(): Vector2D {
        return new Vector2D(this.w, this.y);
    }

    public zw(): Vector2D {
        return new Vector2D(this.z, this.w);
    }

    public wz(): Vector2D {
        return new Vector2D(this.w, this.z);
    }
}
