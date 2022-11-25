import { AbstractComponent } from './abstract_component.js';
import { CommonEntity } from '../../models/entities.js';
import { PointLike } from 'aurum-layout-engine';
import { DataSource, CancellationToken } from 'aurumjs';
import { Vector2D } from '../../math/vectors/vector2d.js';
import { Clock } from '../../game_features/time/clock.js';
import { SceneGraphNode } from '../../models/scene_graph.js';
import { engineClock } from '../../core/stage.js';

export interface MovementComponentConfiguration {
    speed: number;
    euclideanMovement?: boolean;
    clock?: Clock;
}

export abstract class AbstractMovementComponent extends AbstractComponent {
    protected movementListeners: DataSource<PointLike>;
    public pause: boolean;
    public config: MovementComponentConfiguration;
    protected clock: Clock;

    constructor(config: MovementComponentConfiguration) {
        super();
        this.config = config;
        this.movementListeners = new DataSource();
        this.pause = false;
        this.clock = config.clock ?? engineClock;
    }

    public stop(): void {
        this.pause = true;
    }

    public resume(): void {
        this.pause = false;
    }

    public listenMovement(cancellationToken?: CancellationToken): DataSource<PointLike> {
        const token = cancellationToken ?? new CancellationToken();
        const result = new DataSource<PointLike>();

        this.movementListeners.pipe(result, token);

        return result;
    }

    protected moveTowardsTarget(entity: SceneGraphNode<CommonEntity>, target: PointLike, delta: number) {
        if (this.pause) {
            return;
        }

        if (typeof entity.resolvedModel.x.value !== 'number') {
            entity.models.userSpecified.x.update(target.x);
        }
        if (typeof entity.resolvedModel.y.value !== 'number') {
            entity.models.userSpecified.y.update(target.y);
        }

        const positionX: DataSource<number> = entity.resolvedModel.x as any;
        const positionY: DataSource<number> = entity.resolvedModel.y as any;

        if (this.config.euclideanMovement) {
            this.approachEuclidean(target, positionX, positionY, delta);
        } else {
            this.approachManhattan(target, positionX, positionY, delta);
        }
    }

    protected approachEuclidean(target: PointLike, positionX: DataSource<number>, positionY: DataSource<number>, time: number) {
        const travel = Vector2D.fromPolarCoordinates(
            this.config.speed * time,
            new Vector2D(positionX.value, positionY.value).connectingVector(target).getAngle()
        );
        positionX.update(positionX.value + Math.min(Math.abs(travel.x), Math.abs(positionX.value - target.x)) * Math.sign(travel.x));
        positionY.update(positionY.value + Math.min(Math.abs(travel.y), Math.abs(positionY.value - target.y)) * Math.sign(travel.y));
        this.movementListeners.update({
            x: Math.min(Math.abs(travel.x), Math.abs(positionX.value - target.x)) * Math.sign(travel.x),
            y: Math.min(Math.abs(travel.y), Math.abs(positionY.value - target.y)) * Math.sign(travel.y)
        });
    }

    protected approachManhattan(target: PointLike, positionX: DataSource<number>, positionY: DataSource<number>, time: number) {
        if (target.x > positionX.value) {
            positionX.update(positionX.value + Math.min(this.config.speed * time, Math.abs(positionX.value - target.x)));
            this.movementListeners.update({
                x: Math.min(this.config.speed * time, Math.abs(positionX.value - target.x)),
                y: 0
            });
        } else if (target.x < positionX.value) {
            positionX.update(positionX.value - Math.min(this.config.speed * time, Math.abs(positionX.value - target.x)));
            this.movementListeners.update({
                x: -Math.min(this.config.speed * time, Math.abs(positionX.value - target.x)),
                y: 0
            });
        } else if (target.y > positionY.value) {
            positionY.update(positionY.value + Math.min(this.config.speed * time, Math.abs(positionY.value - target.y)));
            this.movementListeners.update({
                x: 0,
                y: Math.min(this.config.speed * time, Math.abs(positionY.value - target.y))
            });
        } else if (target.y < positionY.value) {
            positionY.update(positionY.value - Math.min(this.config.speed * time, Math.abs(positionY.value - target.y)));
            this.movementListeners.update({
                x: 0,
                y: -Math.min(this.config.speed * time, Math.abs(positionY.value - target.y))
            });
        }
    }
}
