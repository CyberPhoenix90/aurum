import { AbstractLayout } from './abstract_layout';
import { PointLike } from '../models/point';
import { pointUtils } from '../math/vectors/point_utils';
import { SceneGraphNode } from '../models/scene_graph';
import { CommonEntity } from '../models/entities';

export interface LinearLayoutConfiguration {
	initialOffset?: PointLike;
	nodeOffset?: PointLike;
}

export class LinearLayout extends AbstractLayout {
	private config: LinearLayoutConfiguration;

	constructor(config: LinearLayoutConfiguration) {
		super();

		const { initialOffset = pointUtils.zero(), nodeOffset = pointUtils.zero() } = config;

		this.config = { initialOffset, nodeOffset };
	}

	public isSizeSensitive(): boolean {
		return false;
	}

	public positionEntityByIndex(
		entity: SceneGraphNode<CommonEntity>,
		index: number,
		siblings: ReadonlyArray<SceneGraphNode<CommonEntity>>,
		parent: SceneGraphNode<CommonEntity>
	): void {
		entity.models.userSpecified.x.update(this.config.initialOffset.x + this.config.nodeOffset.x * index);
		entity.models.userSpecified.y.update(this.config.initialOffset.y + this.config.nodeOffset.y * index);
	}
}
