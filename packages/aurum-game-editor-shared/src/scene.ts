export interface SceneModel {
	code: string;
	settings: SceneSettings;
	entities: SceneEntityData[];
	cameraEntities: SceneEntityData[];
}

export interface SceneSettings {
	backgroundMusic: {
		track: string;
		volume: number;
	};
}

export interface SceneEntityData {
	name: string;
	innerText?: string;
	namespace: string;
	properties: { [key: string]: any };
	children: SceneEntityData[];
}
