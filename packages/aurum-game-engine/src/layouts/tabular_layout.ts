import { AbstractLayout } from './abstract_layout';
import { PointLike } from '../models/point';
import { pointUtils } from '../math/vectors/point_utils';
import { CommonEntity } from '../models/entities';
import { SceneGraphNode } from '../models/scene_graph';
import { Vector2D } from '../math/vectors/vector2d';

export interface TabularLayoutConfiguration {
	initialOffset?: PointLike;
	rowOffset?: PointLike[];
	columnOffset?: PointLike[];
	itemsPerRow: number;
}

export class TabularLayout extends AbstractLayout {
	private config: TabularLayoutConfiguration;

	constructor(config: TabularLayoutConfiguration) {
		super();

		const { initialOffset = pointUtils.zero(), rowOffset = [pointUtils.zero()], columnOffset = [pointUtils.zero()], itemsPerRow } = config;

		if (itemsPerRow <= 0) {
			throw new Error('tabular layout needs 1 or more items per row');
		}

		this.config = { initialOffset, rowOffset, columnOffset, itemsPerRow };
	}

	public isSizeSensitive(): boolean {
		return false;
	}

	public positionEntityByIndex(
		entity: SceneGraphNode<CommonEntity>,
		index: number,
		entities: ReadonlyArray<SceneGraphNode<CommonEntity>>,
		parent: SceneGraphNode<CommonEntity>
	): void {
		const x: number = index % this.config.itemsPerRow;
		const y: number = Math.floor(index / this.config.itemsPerRow);

		const position = Vector2D.fromPointLike(this.config.initialOffset);

		for (let i = 0; i < x; i++) {
			position.add(this.config.columnOffset[i % this.config.columnOffset.length]);
		}

		for (let i = 0; i < y; i++) {
			position.add(this.config.rowOffset[i % this.config.rowOffset.length]);
		}

		entity.models.userSpecified.x.update(position.x);
		entity.models.userSpecified.y.update(position.y);
	}
}
