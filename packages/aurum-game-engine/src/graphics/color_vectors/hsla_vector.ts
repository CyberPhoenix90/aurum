import { Vector4D } from '../../math/vectors/vector4d.js';
import { RGBAVector } from './rgba_vector.js';

export class HSLAVector extends Vector4D {
    public get h(): number {
        return this.memory[0];
    }

    public get s(): number {
        return this.memory[1];
    }

    public get l(): number {
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

    public set l(value: number) {
        this.memory[2] = value;
    }

    public set a(value: number) {
        this.memory[3] = value;
    }

    constructor(h: number, s: number, l: number, a: number) {
        super(h % 360, s, l, a);
    }

    public toRGBA(): RGBAVector {
        let r, g, b;

        if (this.s === 0) {
            r = g = b = this.l;
        } else {
            const hue2rgb = function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = this.l < 0.5 ? this.l * (1 + this.s) : this.l + this.s - this.l * this.s;
            const p = 2 * this.l - q;
            r = hue2rgb(p, q, this.h / 360 + 1 / 3);
            g = hue2rgb(p, q, this.h / 360);
            b = hue2rgb(p, q, this.h / 360 - 1 / 3);
        }

        return new RGBAVector(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), this.a);
    }
}
