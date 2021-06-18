import { RGBAVector } from './rgba_vector';
import { Vector3D } from '../../math/vectors/vector3d';

export class HSVVector extends Vector3D {
	public get h(): number {
		return this.memory[0];
	}

	public get s(): number {
		return this.memory[1];
	}

	public get v(): number {
		return this.memory[2];
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

	constructor(h: number, s: number, v: number) {
		super(h % 360, s, v);
	}

	public toRGBA(a: number): RGBAVector {
		const result = new RGBAVector(0, 0, 0, a);
		if (this.s === 0) {
			result.r = this.v;
			result.g = this.v;
			result.b = this.v;
		} else {
			const region: number = this.h / 60;
			const remainder: number = (this.h - region * 60) * 6;
			const s = this.s * 255;
			const v = this.v * 255;

			const p = (v * (255 - s)) >> 8;
			const q = (v * (255 - ((s * remainder) >> 8))) >> 8;
			const t = (v * (255 - ((s * (255 - remainder)) >> 8))) >> 8;

			switch (Math.floor(region)) {
				case 0:
					result.r = v;
					result.g = t;
					result.b = p;
					break;
				case 1:
					result.r = q;
					result.g = v;
					result.b = p;
					break;
				case 2:
					result.r = p;
					result.g = v;
					result.b = t;
					break;
				case 3:
					result.r = p;
					result.g = q;
					result.b = v;
					break;
				case 4:
					result.r = t;
					result.g = p;
					result.b = v;
					break;
				default:
					result.r = v;
					result.g = p;
					result.b = q;
					break;
			}
		}
		return result;
	}
}
