import {
    AbstractShape,
    CanvasGraphNode,
    Circle,
    Color,
    ComposedShape,
    PaintOperation,
    Polygon,
    Rectangle,
    RoundedRectangle,
    RegularPolygon,
    Vector2D,
    AbstractReactiveShape,
    ReactiveRectangle
} from 'aurum-game-engine';
import { ArrayDataSource, CancellationToken, DataSource } from 'aurumjs';
import { Graphics } from 'pixi.js';
import { NoRenderEntity } from './pixi_no_render_entity';

export class RenderCanvasEntity extends NoRenderEntity {
    public declare displayObject: Graphics;
    private paintOperations: ArrayDataSource<PaintOperation>;
    private drawToken: CancellationToken;

    constructor(config: CanvasGraphNode) {
        super(config);
        this.paintOperations = config.renderState.paintOperations;
        this.paintOperations.listenAndRepeat(() => {
            this.drawAll();
        }, config.cancellationToken);
    }

    protected createDisplayObject() {
        return new Graphics();
    }

    private drawAll() {
        if (this.drawToken) {
            this.drawToken.cancel();
        }
        this.drawToken = new CancellationToken();
        this.displayObject.clear();
        for (const action of this.paintOperations.getData()) {
            this.drawAction(action, this.drawToken);
        }

        this.model.resolvedModel.autoWidth.update(this.displayObject.width);
        this.model.resolvedModel.autoHeight.update(this.displayObject.height);
    }

    private drawAction(action: PaintOperation, token: CancellationToken) {
        if (action.fillStyle instanceof DataSource) {
            action.fillStyle.listen(() => {
                this.drawAll();
            }, token);
        }

        if (action.strokeStyle instanceof DataSource) {
            action.strokeStyle.listen(() => {
                this.drawAll();
            }, token);
        }

        if (action.strokeThickness instanceof DataSource) {
            action.strokeThickness.listen(() => {
                this.drawAll();
            }, token);
        }

        const color = Color.fromString(action.fillStyle instanceof DataSource ? action.fillStyle.value : action.fillStyle ?? 'transparent');
        this.displayObject.beginFill(color.toRGBNumber(), color.a / 256);
        const strokeColor = Color.fromString(action.strokeStyle instanceof DataSource ? action.strokeStyle.value : action.strokeStyle ?? 'transparent');
        this.displayObject.lineStyle(
            action.strokeThickness instanceof DataSource ? action.strokeThickness.value : action.strokeThickness ?? 1,
            strokeColor.toRGBNumber(),
            strokeColor.a / 256,
            action.strokeAlignment ?? 0.5
        );
        const shape = action.shape;
        this.renderShape(shape, token);
    }

    private renderShape(shape: AbstractShape | AbstractReactiveShape, drawToken: CancellationToken, offsetX: number = 0, offsetY: number = 0) {
        if (shape instanceof AbstractReactiveShape) {
            shape.position.x.listen(() => {
                this.drawAll();
            }, drawToken);
            shape.position.y.listen(() => {
                this.drawAll();
            }, drawToken);
        }

        if (shape instanceof ReactiveRectangle) {
            shape.size.x.listen(() => {
                this.drawAll();
            }, drawToken);
            shape.size.y.listen(() => {
                this.drawAll();
            }, drawToken);
        }

        if (shape instanceof RoundedRectangle) {
            this.displayObject.drawRoundedRect(shape.x + offsetX, shape.y + offsetY, shape.width, shape.height, shape.radius);
        } else if (shape instanceof Rectangle || shape instanceof ReactiveRectangle) {
            this.displayObject.drawRect(shape.x + offsetX, shape.y + offsetY, shape.width, shape.height);
        } else if (shape instanceof Circle) {
            this.displayObject.drawCircle(shape.x + offsetX, shape.y + offsetY, shape.radius);
        } else if (shape instanceof RegularPolygon) {
            const point = new Vector2D(0, -shape.radius);
            this.displayObject.moveTo(shape.x + shape.radius, shape.y);
            for (let i = 0; i < shape.sides; i++) {
                point.rotateBy(Math.PI / (shape.sides / 2));
                this.displayObject.lineTo(point.x + shape.radius + shape.x, point.y + shape.radius + shape.y);
            }
        } else if (shape instanceof Polygon) {
            for (const point of shape.points) {
                if (point === shape.points[0]) {
                    this.displayObject.moveTo(point.x + shape.x + offsetX, point.y + offsetY + shape.y);
                } else {
                    this.displayObject.lineTo(point.x + shape.x + offsetX, point.y + offsetY + shape.y);
                }
            }
        } else if (shape instanceof ComposedShape) {
            for (const subShape of shape.shapes) {
                this.renderShape(subShape, drawToken, offsetX + shape.x, offsetY + shape.y);
            }
        }
    }
}
