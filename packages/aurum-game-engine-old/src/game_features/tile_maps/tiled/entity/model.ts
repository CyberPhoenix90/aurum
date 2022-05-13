import { CommonEntity } from '../../../../models/entities';
import { EntityRenderModel } from '../../../../rendering/model';
import { TiledLayer } from '../tiled_layer';
import { TiledMapModel } from '../tiled_map_format';
import { Tileset } from '../tileset';
import { EntityFactory, MapObject } from './tiled_map_entity';
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
