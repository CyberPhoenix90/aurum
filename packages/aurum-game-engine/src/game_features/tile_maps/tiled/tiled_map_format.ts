import { PointLike } from 'aurum-layout-engine';

/**
 * based on the json export of the editor tiled
 * Editor: http://www.mapeditor.org/
 * JSON: https://github.com/bjorn/tiled/wiki/JSON-Map-Format
 */
export interface TiledMapModel {
    // number of tiles in the width
    width: number;
    // number of tiles in the height
    height: number;
    hexsidelength?: number;
    tilewidth: number;
    tileheight: number;
    tilesets: TiledMapTilesetModel[];
    layers: TiledMapLayerModel[];
    // custom properties
    properties?: TiledMapCustomProperties[];
    version: number;
    orientation: string; //'orthogonal' | 'hexagonal' | 'isometric';
}

export interface TiledMapTilesetModel {
    // Path to tileset texture
    image?: string;
    // tileset name
    name: string;
    tilewidth: number;
    tileheight: number;
    // custom properties
    properties?: TiledMapCustomProperties[];
    // custom properties of individual tiles
    tileproperties?: TiledMapTileProperties;
    // GID of the first tile
    firstgid: number;
    // To be used together with firstgid to figure out if a tile comes from this tileset or not
    tilecount: number;
    // Used by tilesets that have a different image for each tile
    tiles?: { [gid: string]: TiledMapTileModel };
}

export interface TiledObjectShapeData {
    ellipse: boolean;
    width: number;
    height: number;
    rotation: number;
    polyline?: PointLike[];
}

export interface TiledMapTileModel {
    image?: string;
    tileproperties?: TiledMapCustomProperties[];
    type?: string;
}

export interface TiledMapTileProperties {
    [gid: string]: TiledMapCustomProperties[];
}

export interface TiledMapCustomProperties {
    name: string;
    type: string;
    value: string;
}

export interface TiledMapObjectModel {
    // Unique object instance id this is only used for regions
    id?: number;
    // width in pixels
    width: number;
    // height in pixels
    height: number;

    name: string;
    // just a string you can set in the editor to let you identify the instance
    type: string;

    visible: boolean;

    properties?: TiledMapCustomProperties[];
    // Pixel exact position
    x: number;
    // Pixel exact position
    y: number;
    // angles in degrees clockwise
    rotation: number;
    // reference to the tile that this object is based on
    gid?: number;
    // if the object is an ellipse
    ellipse?: boolean;
    // if the object is a polygon this is the points
    polyline?: Array<{ x: number; y: number }>;
}

export interface TiledMapLayerModel {
    // array of IDs of tiles which are unique across all tilesets in this map only for tile layer
    data?: number[];
    name: string;
    // custom properties
    properties?: TiledMapCustomProperties[];
    type: string; //'tilelayer' | 'objectgroup' | 'imagelayer';
    visible: boolean;
    // array of objects only for object group layer
    objects?: TiledMapObjectModel[];
    // layer z-index
    draworder?: string;
    opacity: number;
}
