import { HSVAVector } from './hsva_vector';
import { HSVVector } from './hsv_vector';
import { Vector4D } from '../../math/vectors/vector4d';

export class RGBAVector extends Vector4D {
	public get r(): number {
		return this.memory[0];
	}

	public get g(): number {
		return this.memory[1];
	}

	public get b(): number {
		return this.memory[2];
	}

	public get a(): number {
		return this.memory[3];
	}

	public set r(value: number) {
		this.memory[0] = value;
	}

	public set g(value: number) {
		this.memory[1] = value;
	}

	public set b(value: number) {
		this.memory[2] = value;
	}

	public set a(value: number) {
		this.memory[3] = value;
	}

	public toHSV(): HSVVector {
		const max = this.max();
		const min = this.min();
		const delta = max - min;
		let h = 0,
			s = 0,
			v = max;
		if (max !== 0) {
			s = delta / max;
		}

		if (delta === 0) {
			h = 0;
		} else if (this.r === max) {
			h = (this.g - this.b) / delta;
		} else if (this.g === max) {
			h = 2 + (this.b - this.r) / delta;
		} else {
			h = 4 + (this.r - this.g) / delta;
		}
		h *= 60;
		if (h < 0) {
			h += 360;
		}

		return new HSVVector(h, s, v);
	}

	public toHSVA(): HSVAVector {
		const { h, s, v } = this.toHSV();
		return new HSVAVector(h, s, v, this.a);
	}

	public clone(): RGBAVector {
		return new RGBAVector(this.memory[0], this.memory[1], this.memory[2], this.memory[3]);
	}
}
