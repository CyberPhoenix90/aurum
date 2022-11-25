import { Vector2D } from '../../../math/vectors/vector2d.js';
import { Rectangle } from '../../../math/shapes/rectangle.js';
import { TiledMapObjectModel, TiledMapLayerModel } from './tiled_map_format.js';

export class TiledLayer {
    public readonly width: number;
    public readonly height: number;
    public readonly data: number[] | undefined;
    public readonly name: string;
    public readonly objects: TiledMapObjectModel[] | undefined;

    constructor(layer: TiledMapLayerModel, width: number, height: number) {
        this.data = layer.data;
        this.objects = layer.objects;
        this.width = width;
        this.height = height;
        this.name = layer.name;
    }

    public getTileData(x: number, y: number): number {
        if (this.data === undefined) {
            throw new Error('this layer does not have tile data');
        }

        return this.data[this.width * y + x];
    }

    public getAllTileGIDs(): number[] {
        if (this.data === undefined) {
            throw new Error('this layer does not have tile data');
        }
        return this.data;
    }

    public tileIndexToVector(index: number): Vector2D {
        return new Vector2D(index % this.width, Math.floor(index / this.width));
    }

    public hasData(): boolean {
        return this.data !== undefined;
    }

    public hasTileByRectangle(rectangle: Rectangle) {
        if (this.data === undefined) {
            throw new Error('this layer does not have tile data');
        }

        for (let x = rectangle.x; x < rectangle.right; x++) {
            for (let y = rectangle.y; y < rectangle.bottom; y++) {
                if (this.data[this.width * y + x]) {
                    return true;
                }
            }
        }
        return false;
    }

    public hasTile(x: number, y: number) {
        if (this.data === undefined) {
            throw new Error('this layer does not have tile data');
        }

        return !!this.data[this.width * y + x];
    }
}
