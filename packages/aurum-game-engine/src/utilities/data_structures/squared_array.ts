import { _ } from '../other/streamline';

export class SquaredArray<T> {
	private data: T[][];
	public readonly width: number;

	constructor(width: number) {
		this.data = new Array(width);
		for (let i = 0; i < width; i++) {
			this.data[i] = [];
		}

		this.width = width;
	}

	public static fromNestedArray<T>(array: T[][]): SquaredArray<T> {
		const s = new SquaredArray<T>(array.length);
		for (let x = 0; x < array.length; x++) {
			array[x].forEach((a) => s.push(x, a));
		}

		return s;
	}

	public transpose(): SquaredArray<T> {
		const width = this.data.map((a) => a.length).reduce((p, c) => Math.max(p, c), 0);
		const s = new SquaredArray<T>(width);
		for (let x = 0; x < this.data.length; x++) {
			for (let y = 0; y < this.data[x].length; y++) {
				s.set(y, x, this.data[x][y]);
			}
		}
		return s;
	}

	public getSlice(x: number): T[] {
		return this.data[x];
	}

	public get(x: number, y: number) {
		return this.data?.[x]?.[y];
	}

	public set(x: number, y: number, item: T) {
		return (this.data[x][y] = item);
	}

	public push(x: number, item: T) {
		this.data[x].push(item);
	}

	public remove(item: T): void {
		for (let x = 0; x < this.data.length; x++) {
			for (let y = 0; y < this.data[x].length; y++) {
				if (this.data[x][y] === item) {
					this.data[x].splice(y, 1);
				}
			}
		}
	}

	public flatten(): T[] {
		return this.data.flat();
	}

	public isEmpty(): boolean {
		return this.data.every((d) => d.length === 0);
	}

	public clone(): SquaredArray<T> {
		const clone = new SquaredArray<T>(this.data.length);
		for (let x = 0; x < this.data.length; x++) {
			clone.data[x] = this.data[x].slice();
		}

		return clone;
	}

	public forEach(cb: (item: T, x: number, y: number) => void): void {
		for (let x = 0; x < this.data.length; x++) {
			for (let y = 0; y < this.data[x].length; y++) {
				cb(this.data[x][y], x, y);
			}
		}
	}
}
