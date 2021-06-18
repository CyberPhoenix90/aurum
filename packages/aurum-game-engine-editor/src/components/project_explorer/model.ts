import { DataSource, ArrayDataSource } from 'aurumjs';

export enum ProjectExplorerNodeType {
	ProjectNode,
	SceneFolder,
	Scene,
	AssetFolder,
	Asset,
	CharacterFolder,
	Character,
	EntityTemplateFolder,
	EntityTemplate,
	ModelsFolder,
	Model,
	SchemaFolder,
	Schema,
	TileMapFolder,
	TileMap,
	TileSetFolder,
	TileSet,
	AnimationFolder,
	StateMachineFolder,
	StateMachine,
	AnimationsFolder,
	Animation,
	CodeFolder,
	GeneratedCode,
	GeneratedCodeFolder,
	Code,
	GlobalsFolder,
	Globals,
	StyleFolder,
	Style,
	ComponentFolder,
	Component
}
export interface ProjectExplorerNode {
	type: ProjectExplorerNodeType;
	name: string | DataSource<string>;
	parent?: DataSource<ProjectExplorerNode>;
	permissions?: {
		newFolder?: boolean | DataSource<boolean>;
		delete?: boolean | DataSource<boolean>;
		rename?: boolean | DataSource<boolean>;
	};
	open?: DataSource<boolean>;
	children: ProjectExplorerNode[] | ArrayDataSource<ProjectExplorerNode>;
}
