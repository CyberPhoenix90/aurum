import { DuplexDataSource, ArrayDataSource, DataSource } from 'aurumjs';
import { SceneSettings } from 'aurum-game-editor-shared';

export interface SceneModelReactive {
	code: DuplexDataSource<string>;
	settings: SceneSettings;
	entities: ArrayDataSource<SceneEntityDataReactive>;
	cameraEntities: ArrayDataSource<SceneEntityDataReactive>;
}

export interface SceneEntityDataReactive {
	name: DataSource<string>;
	namespace: string;
	innerText?: DataSource<string>;
	properties: { [key: string]: DataSource<any> };
	children: ArrayDataSource<SceneEntityDataReactive>;
	parent: DataSource<SceneEntityDataReactive>;
}
