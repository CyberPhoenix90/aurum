import { Vector4D } from '../../math/vectors/vector4d.js';
import { HSVVector } from './hsv_vector.js';

export class HSVAVector extends Vector4D {
    public get h(): number {
        return this.memory[0];
    }

    public get s(): number {
        return this.memory[1];
    }

    public get v(): number {
        return this.memory[2];
    }

    public get a(): number {
        return this.memory[3];
    }

    public set h(value: number) {
        this.memory[0] = value;
    }

    public set s(value: number) {
        this.memory[1] = value;
    }

    public set v(value: number) {
        this.memory[2] = value;
    }

    public set a(value: number) {
        this.memory[3] = value;
    }

    constructor(h: number, s: number, v: number, a: number) {
        super(h % 360, s, v, a);
    }

    public toHSVVector(): HSVVector {
        return new HSVVector(this.h, this.s, this.v);
    }
}
