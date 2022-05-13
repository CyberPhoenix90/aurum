import { inject, Trait } from '../../core/entity';
import { Color } from '../../graphics/color';
import { Data } from '../../utilities/data';
import { BoundingBox2D } from './bounding_box2D';
import { Position2D } from './position2d';

export interface Camera2DSettings {
    resolutionX?: Data<number>;
    resolutionY?: Data<number>;
    backgroundColor?: Data<Color>;
}

export class Camera2DData extends Trait {
    public readonly resolutionX: Data<number>;
    public readonly resolutionY: Data<number>;
    public readonly backgroundColor: Data<Color>;
    public get x(): Data<number> {
        return this.position.x;
    }
    public get y(): Data<number> {
        return this.position.y;
    }
    public get width(): Data<number> {
        return this.boundingBox.width;
    }
    public get height(): Data<number> {
        return this.boundingBox.height;
    }

    @inject(Position2D)
    private position: Position2D;

    @inject(BoundingBox2D)
    private boundingBox: BoundingBox2D;

    constructor(settings: Camera2DSettings) {
        super();
        this.resolutionX = settings.resolutionX;
        this.resolutionY = settings.resolutionY;
        this.backgroundColor = settings.backgroundColor ?? Color.BLACK;
    }
}
