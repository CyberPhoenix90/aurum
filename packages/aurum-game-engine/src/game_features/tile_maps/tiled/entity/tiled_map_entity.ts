import { ArrayDataSource, AurumComponentAPI, Renderable, DataSource } from 'aurumjs';
import { entityDefaults } from '../../../../entities/entity_defaults.js';
import { normalizeComponents, propsToModel } from '../../../../entities/shared.js';
import { AbstractShape } from '../../../../math/shapes/abstract_shape.js';
import { Circle } from '../../../../math/shapes/circle.js';
import { Polygon } from '../../../../math/shapes/polygon.js';
import { Rectangle } from '../../../../math/shapes/rectangle.js';
import { Vector2D } from '../../../../math/vectors/vector2d.js';
import { CommonEntityProps } from '../../../../models/entities.js';
import { PointLike } from 'aurum-layout-engine';
import { TiledLayer } from '../tiled_layer.js';
import {
    TiledMapCustomProperties,
    TiledMapLayerModel,
    TiledMapModel,
    TiledMapObjectModel,
    TiledMapTilesetModel,
    TiledObjectShapeData
} from '../tiled_map_format.js';
import { Tileset } from '../tileset.js';
import { TiledMapGraphNode } from './api.js';
import { toSourceIfDefined } from '../../../../utilities/data/to_source.js';
import { TiledMapEntity } from './model.js';

export interface EntityFactory {
    [type: string]: (position: PointLike, props: TiledMapCustomProperties[], shape: AbstractShape) => Renderable;
}

export interface MapObject {
    layer: number;
    object: Renderable;
}

export interface TiledMapProps extends CommonEntityProps {
    resourceRootUrl: string;
    model: TiledMapModel;
    tilesets?: Tileset[];
    onAttach?(node: TiledMapGraphNode): void;
    onDetach?(node: TiledMapGraphNode): void;
    entityFactory?: Readonly<EntityFactory>;
    class?: TiledMapEntity[] | ArrayDataSource<TiledMapEntity>;
}

export function TiledMap(props: TiledMapProps, children: Renderable[], api: AurumComponentAPI): TiledMapGraphNode {
    const mapObjects: MapObject[] = [];
    const layers: TiledLayer[] = [];

    props.tilesets = props.tilesets ?? [];
    props.model.tilesets.forEach((t: TiledMapTilesetModel) => {
        props.tilesets.push(new Tileset(t, props.resourceRootUrl));
    });

    props.model.layers.forEach((t: TiledMapLayerModel, index: number) => {
        const layer = new TiledLayer(t, props.model.width, props.model.height);
        processLayer(layer, props, mapObjects, index);
        layers.push(layer);
    });

    return new TiledMapGraphNode({
        name: props.name ?? TiledMapGraphNode.name,
        components: normalizeComponents(props.components),
        children: undefined,
        cancellationToken: api.cancellationToken,
        models: {
            coreDefault: entityDefaults,
            appliedStyleClasses: props.class instanceof ArrayDataSource ? props.class : new ArrayDataSource(props.class),
            entityTypeDefault: tilemapDefaultModel,
            userSpecified: {
                ...propsToModel(props),
                tilesets: new ArrayDataSource(props.tilesets),
                resourceRootUrl: toSourceIfDefined(props.resourceRootUrl),
                entityFactory: toSourceIfDefined(props.entityFactory),
                mapObjects: new ArrayDataSource(mapObjects),
                layers: new ArrayDataSource(layers),
                mapData: toSourceIfDefined(props.model)
            }
        },
        onAttach: props.onAttach,
        onDetach: props.onDetach
    });
}

function processLayer(layer: TiledLayer, props: TiledMapProps, mapObjects: MapObject[], index: number): void {
    if (layer.objects && props.entityFactory !== undefined) {
        layer.objects.forEach((o: TiledMapObjectModel) => {
            if (props.entityFactory[o.type] === undefined) {
                console.warn('No entity factory for entity of type' + o.type + ' defined');
            } else {
                const entity: Renderable = props.entityFactory[o.type](
                    o,
                    o.properties,
                    shapeFactory(
                        { x: o.x, y: o.y },
                        {
                            ellipse: o.ellipse,
                            polyline: o.polyline,
                            width: o.width,
                            height: o.height,
                            rotation: o.rotation
                        }
                    )
                );

                if (entity !== undefined) {
                    mapObjects.push({
                        layer: index,
                        object: entity
                    });
                }
            }
        });
    }
}

function shapeFactory(position: PointLike, shapeData: TiledObjectShapeData): AbstractShape {
    if (shapeData.polyline) {
        return new Polygon(
            position,
            shapeData.polyline.map((p) => Vector2D.fromPointLike(p))
        );
    } else if (shapeData.ellipse) {
        return new Circle(Vector2D.fromPointLike({ x: position.x + shapeData.width / 2, y: position.y + shapeData.width / 2 }), shapeData.width / 2);
    } else {
        return new Rectangle(position, new Vector2D(shapeData.width, shapeData.height));
    }
}

// export class _TiledMap extends ContainerEntity {

// 	public hasTileByRectangle(layer: number, rectangle: Rectangle): boolean {
// 		const selectedLayer: TiledLayer | undefined = this.layerModel[layer];
// 		if (selectedLayer === undefined || !selectedLayer.hasData()) {
// 			return false;
// 		} else {
// 			return selectedLayer.hasTileByRectangle(rectangle);
// 		}
// 	}

// 	/**
// 	 * Iterates the whole layer calling the query function for every single tile, if the query returns true, the iteration is aborted
// 	 */
// 	public queryAllTilesInLayer(layerIndex: number, query: (tile: ITiledMapTile, x: number, y: number) => boolean | void): void {
// 		const selectedLayer: TiledLayer | undefined = this.layerModel[layerIndex];
// 		if (selectedLayer) {
// 			for (let x: number = 0; x < selectedLayer.width; x++) {
// 				for (let y: number = 0; y < selectedLayer.height; y++) {
// 					const tileData = this.getTileMetaDataByGid(selectedLayer.getTileData(x, y));
// 					if (tileData) {
// 						if (query(tileData, x, y)) {
// 							return;
// 						}
// 					}
// 				}
// 			}
// 		} else {
// 			throw new Error(`No layer for index ${layerIndex}`);
// 		}
// 	}

// 	public projectRectangleToMapCoordinates(rectangle: Rectangle): Rectangle {
// 		rectangle.x /= this.tileWidth;
// 		rectangle.y /= this.tileHeight;
// 		rectangle.width /= this.tileWidth;
// 		rectangle.height /= this.tileHeight;

// 		let minX, maxX, minY, maxY;

// 		minX = Math.round(rectangle.x);
// 		minY = Math.round(rectangle.y);
// 		maxX = Math.round(rectangle.x + rectangle.width);
// 		maxY = Math.round(rectangle.y + rectangle.height);

// 		return new Rectangle(new Vector2D(minX, minY), new Vector2D(1 + maxX - minX, 1 + maxY - minY));
// 	}

// 	public projectPointToMapCoordinates(point: Vector2D): Vector2D {
// 		return point
// 			.clone()
// 			.componentWiseDivision(new Vector2D(this.tileWidth, this.tileHeight))
// 			.round();
// 	}

// 	public projectMapCoordinatesToRegularCoordinates(point: Vector2D): Vector2D {
// 		return point.clone().componentWiseMultiplication(new Vector2D(this.tileWidth, this.tileHeight));
// 	}

// 	public snapRectangleToTiles(rectangle: Rectangle): Rectangle {
// 		rectangle.x = rectangle.x - (rectangle.x % this.tileWidth);
// 		rectangle.y = rectangle.y - (rectangle.y % this.tileHeight);

// 		rectangle.width = rectangle.width + ((this.tileWidth - (rectangle.width % this.tileWidth)) % this.tileWidth);
// 		rectangle.height = rectangle.height + ((this.tileHeight - (rectangle.height % this.tileHeight)) % this.tileHeight);

// 		return rectangle;
// 	}

// 	public snapPointToTiles(point: Vector2D): Vector2D {
// 		point.x = point.x - (point.x % this.tileWidth);
// 		point.y = point.y - (point.y % this.tileHeight);

// 		return point;
// 	}

// 	public getTileByPosition(point: Vector2D, layer: number): ITiledMapTile {
// 		const p = this.projectPointToMapCoordinates(point);
// 		return this.getTileMetadata(layer, p.x, p.y);
// 	}

// 	public findLayerByName(layerName: string): AbstractEntity | undefined {
// 		return this.children.find((c) => c.name === layerName);
// 	}

// 	public findLayerIndexByName(layerName: string): number {
// 		return this.children.findIndex((c) => c.name === layerName);
// 	}
// }

export const tilemapDefaultModel: TiledMapEntity = {
    resourceRootUrl: new DataSource('/'),
    tilesets: new ArrayDataSource([]),
    entityFactory: new DataSource(undefined)
};
