import { Canvas, PaintOperation, Rectangle } from 'aurum-game-engine';
import { Aurum, DuplexDataSource, ReadOnlyDataSource } from 'aurumjs';

export interface SceneGrid {
	xSpace: DuplexDataSource<number>;
	ySpace: DuplexDataSource<number>;
	render: DuplexDataSource<boolean>;
	color: DuplexDataSource<string>;
	snap: DuplexDataSource<boolean>;
}

export interface GridProps extends SceneGrid {
	width: ReadOnlyDataSource<number>;
	height: ReadOnlyDataSource<number>;
}

export function Grid(props: GridProps) {
	return props.render.aggregate([props.xSpace, props.ySpace, props.width, props.height, props.color], (render, xs, ys, w, h, color) => {
		if (render && xs > 0 && ys > 0) {
			const result: PaintOperation[] = [];
			for (let x = xs; x < w; x += xs) {
				result.push({
					fillStyle: color,
					shape: new Rectangle({ x, y: 0 }, { x: 1, y: h })
				});
			}
			for (let y = ys; y < h; y += ys) {
				result.push({
					fillStyle: color,
					shape: new Rectangle({ x: 0, y }, { x: w, y: 1 })
				});
			}
			return <Canvas alpha={0.4} paintOperations={result}></Canvas>;
		} else {
			return undefined;
		}
	});
}
