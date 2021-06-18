import { TabularLayout } from './tabular_layout';
import { PointLike } from '../models/point';

export interface GridLayoutConfiguration {
	initialOffset?: PointLike;
	rowOffset?: PointLike;
	columnOffset?: PointLike;
	itemsPerRow: number;
}

export class GridLayout extends TabularLayout {
	constructor(config: GridLayoutConfiguration) {
		super({
			columnOffset: [config.columnOffset],
			initialOffset: config.initialOffset,
			itemsPerRow: config.itemsPerRow,
			rowOffset: [config.rowOffset]
		});
	}
}
