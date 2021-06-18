import { AbstractLayout } from './abstract_layout';
import { PointLike } from '../models/point';
import { DIRECTION4 } from '../models/common';
import { SceneGraphNode } from '../models/scene_graph';
import { CommonEntity } from '../models/entities';

export interface StackLayoutConfiguration {
	initialOffset?: PointLike;
	stackDirection: DIRECTION4;
	overflow?: {
		maxStackSize: number;
		direction: DIRECTION4;
	};
	gutter?: PointLike;
}

export class StackLayout extends AbstractLayout {
	private config: StackLayoutConfiguration;

	constructor(config: StackLayoutConfiguration) {
		super();
		this.config = config;
	}

	public positionChildren(children: ReadonlyArray<SceneGraphNode<CommonEntity>>, parent: SceneGraphNode<CommonEntity>): void {
		this.recomputeStack(children, parent);
	}

	public positionEntityByIndex(
		entity: SceneGraphNode<CommonEntity>,
		index: number,
		siblings: ReadonlyArray<SceneGraphNode<CommonEntity>>,
		parent: SceneGraphNode<CommonEntity>
	): void {
		this.recomputeStack(siblings, parent);
	}

	public isSizeSensitive(): boolean {
		return true;
	}

	private recomputeStack(entities: ReadonlyArray<SceneGraphNode<CommonEntity>>, parent: SceneGraphNode<CommonEntity>): void {
		let offset = this.config.initialOffset ?? { x: 0, y: 0 };
		for (let i = 0; i < entities.length; i++) {
			entities[i].models.userSpecified.x.update(offset.x);
			entities[i].models.userSpecified.y.update(offset.y);

			const width = entities[i].renderState.width.value;
			const height = entities[i].renderState.height.value;

			switch (this.config.stackDirection) {
				case DIRECTION4.RIGHT:
					offset.x += width;
					if (this.config.gutter) {
						offset.x += this.config.gutter.x;
					}
					break;
				case DIRECTION4.LEFT:
					throw new Error('not implemented');
				case DIRECTION4.DOWN:
					offset.y += height;
					if (this.config.gutter) {
						offset.y += this.config.gutter.y;
					}
					break;
				case DIRECTION4.UP:
					throw new Error('not implemented');
			}
		}
	}
}
