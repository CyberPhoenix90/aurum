import { DIRECTION2 } from '../models/common';
import { CommonEntity } from '../models/entities';
import { SceneGraphNode } from '../models/scene_graph';
import { AbstractLayout } from './abstract_layout';

export interface SpaceAroundLayoutConfiguration {
	outerMargin?: boolean;
	layoutDirection: DIRECTION2;
}

export class SpaceAroundLayout extends AbstractLayout {
	private config: SpaceAroundLayoutConfiguration;

	constructor(config: SpaceAroundLayoutConfiguration) {
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
		if (entities.length === 0) {
			return;
		}

		if (this.config.outerMargin && entities.length === 1) {
			if (this.config.layoutDirection === DIRECTION2.HORIZONTAL) {
				entities[0].models.userSpecified.x.update(0);
			} else {
				entities[0].models.userSpecified.y.update(0);
			}
		}

		const space = (this.config.layoutDirection === DIRECTION2.HORIZONTAL ? parent.renderState.width.value : parent.renderState.height.value) ?? 0;
		let size = 0;
		for (let i = 0; i < entities.length; i++) {
			size += (this.config.layoutDirection === DIRECTION2.HORIZONTAL ? entities[i].renderState.width.value : entities[i].renderState.height.value) ?? 0;
		}
		let totalMargin = space - size;
		let finalMargin = 0;
		let offset = 0;
		if (this.config.outerMargin) {
			finalMargin = totalMargin / (entities.length + 1);
			for (let i = 0; i < entities.length; i++) {
				if (this.config.layoutDirection === DIRECTION2.HORIZONTAL) {
					entities[i].models.userSpecified.x.update((i + 1) * finalMargin + offset);
					offset += entities[i].renderState.width.value ?? 0;
				} else {
					entities[i].models.userSpecified.y.update((i + 1) * finalMargin + offset);
					offset += entities[i].renderState.height.value ?? 0;
				}
			}
		} else {
			finalMargin = totalMargin / (entities.length - 1);
			for (let i = 0; i < entities.length; i++) {
				if (this.config.layoutDirection === DIRECTION2.HORIZONTAL) {
					entities[i].models.userSpecified.x.update(i * finalMargin + offset);
					offset += entities[i].renderState.width.value ?? 0;
				} else {
					entities[i].models.userSpecified.y.update(i * finalMargin + offset);
					offset += entities[i].renderState.height.value ?? 0;
				}
			}
		}
	}
}
