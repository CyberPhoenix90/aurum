import { Rectangle } from '../../math/shapes/rectangle';
import { SIDE } from '../../models/common';
import { CommonEntity } from '../../models/entities';
import { SceneGraphNode } from '../../models/scene_graph';
import { AbstractComponent } from './abstract_component';

export interface BoundsConfig {
	bounds: Rectangle;
	onOutOfBounds(bound: SIDE, entity: SceneGraphNode<CommonEntity>): void;
}

export class BoundsComponent extends AbstractComponent {
	private config: BoundsConfig;

	constructor(config: BoundsConfig) {
		super();
		this.config = config;
	}

	public onAttach(entity: SceneGraphNode<CommonEntity>) {
		entity.renderState.x.listen(() => {
			const { bounds } = this.config;
			if (entity.renderState.x.value < bounds.x) {
				this.config.onOutOfBounds(SIDE.LEFT, entity);
			}
			if (entity.renderState.x.value > bounds.x + bounds.width) {
				this.config.onOutOfBounds(SIDE.RIGHT, entity);
			}
		});

		entity.renderState.y.listen(() => {
			const { bounds } = this.config;
			if (entity.renderState.y.value < bounds.y) {
				this.config.onOutOfBounds(SIDE.TOP, entity);
			}
			if (entity.renderState.y.value > bounds.y + bounds.height) {
				this.config.onOutOfBounds(SIDE.BOTTOM, entity);
			}
		});
	}
}
