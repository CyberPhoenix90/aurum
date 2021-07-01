import { DataSource } from 'aurumjs';

export interface PointLike {
	x: number;
	y: number;
}

export interface ReactivePointLike {
	x: DataSource<number>;
	y: DataSource<number>;
}
