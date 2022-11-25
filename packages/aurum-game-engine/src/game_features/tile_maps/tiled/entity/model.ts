import { CommonEntity } from '../../../../models/entities.js';
import { EntityRenderModel } from '../../../../rendering/model.js';
import { TiledLayer } from '../tiled_layer.js';
import { TiledMapModel } from '../tiled_map_format.js';
import { Tileset } from '../tileset.js';
import { EntityFactory, MapObject } from './tiled_map_entity.js';
import { DataSource, ArrayDataSource } from 'aurumjs';

export interface TiledMapEntity extends CommonEntity {
    resourceRootUrl?: DataSource<string>;
    tilesets: ArrayDataSource<Tileset>;
    mapObjects?: ArrayDataSource<MapObject>;
    layers?: ArrayDataSource<TiledLayer>;
    mapData?: DataSource<TiledMapModel>;
    entityFactory?: DataSource<EntityFactory>;
    class?: TiledMapEntity[] | ArrayDataSource<TiledMapEntity>;
}

export interface TiledMapRenderModel extends EntityRenderModel {
    tilesets: ArrayDataSource<Tileset>;
    layers: ArrayDataSource<TiledLayer>;
    mapData: DataSource<TiledMapModel>;
}
