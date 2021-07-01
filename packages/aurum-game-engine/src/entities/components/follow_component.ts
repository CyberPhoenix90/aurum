import { onBeforeRender } from '../../core/stage';
import { Vector2D } from '../../math/vectors/vector2d';
import { CommonEntity } from '../../models/entities';
import { PointLike } from 'aurum-layout-engine';
import { SceneGraphNode } from '../../models/scene_graph';
import { AbstractMovementComponent, MovementComponentConfiguration } from './abstract_movement_component';

export interface FollowingConfig extends MovementComponentConfiguration {
    target?: SceneGraphNode<CommonEntity>;
    offset?: PointLike;
    tolerance?: PointLike;
}

export class FollowComponent extends AbstractMovementComponent {
    public declare config: FollowingConfig;

    constructor(
        followingConfig: FollowingConfig = {
            speed: Number.MAX_SAFE_INTEGER,
            offset: {
                x: 0,
                y: 0
            }
        }
    ) {
        super(followingConfig);
    }

    public onAttach(entity: SceneGraphNode<CommonEntity>) {
        let time = this.clock.timestamp;
        onBeforeRender.subscribe(() => {
            const delta = this.clock.timestamp - time;
            time += delta;
            if (this.config.target && !this.config.target.cancellationToken.isCanceled) {
                if (this.config.tolerance) {
                    const distance = new Vector2D(this.config.target.getAbsolutePositionX(), this.config.target.getAbsolutePositionY())
                        .add(this.config.offset)
                        .sub(new Vector2D(entity.getAbsolutePositionX(), entity.getAbsolutePositionY()));
                    if (Math.abs(distance.x) < this.config.tolerance.x) {
                        return;
                    }
                    if (Math.abs(distance.y) < this.config.tolerance.y) {
                        return;
                    }
                }
                this.moveTowardsTarget(
                    entity,
                    {
                        x: this.config.target.getAbsolutePositionX() - entity.parent.value?.getAbsolutePositionX() ?? 0,
                        y: this.config.target.getAbsolutePositionY() - entity.parent.value?.getAbsolutePositionY() ?? 0
                    },
                    delta
                );
            }
        });
    }

    public unfollow(): this {
        this.config.target = undefined;
        return this;
    }

    public follow(target: SceneGraphNode<CommonEntity>, offset: PointLike = { x: 0, y: 0 }): this {
        this.config.target = target;
        this.config.offset = offset;
        return this;
    }
}
