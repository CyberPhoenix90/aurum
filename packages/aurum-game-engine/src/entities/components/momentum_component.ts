import { DataSource } from 'aurumjs';
import { engineClock, onBeforeRender } from '../../core/stage';
import { Clock } from '../../game_features/time/clock';
import { CommonEntity } from '../../models/entities';
import { PointLike } from '../../models/point';
import { SceneGraphNode } from '../../models/scene_graph';
import { AbstractComponent } from './abstract_component';

export interface MomentumConfig {
	speed: PointLike;
	clock?: Clock;
}

export class MomentumComponent extends AbstractComponent {
	public momentumConfig: MomentumConfig;

	constructor(momentumConfig: MomentumConfig) {
		super();
		this.momentumConfig = momentumConfig;
	}

	public onAttach(entity: SceneGraphNode<CommonEntity>) {
		let time = (this.momentumConfig.clock ?? engineClock).timestamp;
		onBeforeRender.subscribe(() => {
			const delta = (this.momentumConfig.clock ?? engineClock).timestamp - time;
			time += delta;

			const positionX: DataSource<number> = entity.resolvedModel.x as any;
			const positionY: DataSource<number> = entity.resolvedModel.y as any;

			positionX.update(entity.renderState.x.value + delta * this.momentumConfig.speed.x);
			positionY.update(entity.renderState.y.value + delta * this.momentumConfig.speed.y);
		}, this.cancellationToken);
	}
}
