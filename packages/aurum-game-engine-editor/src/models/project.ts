import { ArrayDataSource, DataSource, dsMap, DuplexDataSource, getValueOf } from 'aurumjs';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, relative, sep } from 'path';
import { ProjectExplorerNode, ProjectExplorerNodeType } from '../components/project_explorer/model';
import { ProjectFile } from './project_file';

export interface ProjectModel {
	name: string;
}

function makeIfNotExist(folder: string): void {
	if (!existsSync(folder)) {
		mkdirSync(folder);
	}
}

function crawl(path: string, folderType: ProjectExplorerNodeType, fileType: ProjectExplorerNodeType): ProjectExplorerNode[] {
	const contents = readdirSync(path);
	const result: ProjectExplorerNode[] = [];
	for (const content of contents) {
		const isFile = statSync(join(path, content)).isFile();
		result.push({
			name: new DataSource(content),
			children: isFile ? new ArrayDataSource() : new ArrayDataSource(crawl(join(path, content), folderType, fileType)),
			type: isFile ? fileType : folderType,
			open: new DataSource(false)
		});
	}

	return result;
}

export class Project {
	public readonly content: ArrayDataSource<ProjectExplorerNode>;
	private projectFiles: Map<string, ProjectFile> = new Map();

	public get projectRootNode(): ProjectExplorerNode {
		return this.content.get(0);
	}

	public readonly folder: string;
	public readonly name: DataSource<string>;

	public addFile(node: ProjectExplorerNode, name: string, content: string = '') {
		const path = join(this.getPathByNode(node), name);
		writeFileSync(path, content);
	}

	public addFolder(node: ProjectExplorerNode, name: string) {
		const path = join(this.getPathByNode(node), name);
		mkdirSync(path);
	}

	constructor(projectModel: ProjectModel, folder: string) {
		this.folder = folder;
		this.name = new DataSource(projectModel.name);

		makeIfNotExist(join(folder, 'Animation'));
		makeIfNotExist(join(folder, 'Animation/Animations'));
		makeIfNotExist(join(folder, 'Animation/Statemachines'));

		makeIfNotExist(join(folder, 'Assets'));
		makeIfNotExist(join(folder, 'Assets/Data'));
		makeIfNotExist(join(folder, 'Assets/Music'));
		makeIfNotExist(join(folder, 'Assets/Sound'));
		makeIfNotExist(join(folder, 'Assets/Textures'));

		makeIfNotExist(join(folder, 'Characters'));
		makeIfNotExist(join(folder, 'Code'));
		makeIfNotExist(join(folder, 'Components'));
		makeIfNotExist(join(folder, 'Entity Templates'));
		makeIfNotExist(join(folder, 'Models'));
		makeIfNotExist(join(folder, 'Models/Created Models'));
		makeIfNotExist(join(folder, 'Models/Schemas'));

		makeIfNotExist(join(folder, 'Globals'));
		makeIfNotExist(join(folder, 'Style'));
		makeIfNotExist(join(folder, 'Scenes'));
		makeIfNotExist(join(folder, 'Tilemaps'));
		makeIfNotExist(join(folder, 'Tilesets'));

		this.content = new ArrayDataSource<ProjectExplorerNode>([
			{
				type: ProjectExplorerNodeType.ProjectNode,
				name: this.name.transform(dsMap((s) => `Project ${s}`)),
				permissions: {
					newFolder: false,
					delete: false
				},
				open: new DataSource(true),
				children: [
					{
						type: ProjectExplorerNodeType.SceneFolder,
						name: new DataSource('Scenes'),
						permissions: {
							rename: false,
							delete: false
						},
						open: new DataSource(true),
						children: new ArrayDataSource(crawl(join(folder, 'Scenes'), ProjectExplorerNodeType.SceneFolder, ProjectExplorerNodeType.Scene))
					},
					{
						name: new DataSource('Models'),
						type: ProjectExplorerNodeType.ModelsFolder,
						permissions: {
							rename: false,
							newFolder: false,
							delete: false
						},
						open: new DataSource(false),
						children: new ArrayDataSource([
							{
								name: new DataSource('Schemas'),
								type: ProjectExplorerNodeType.SchemaFolder,
								permissions: {
									rename: false,
									delete: false
								},
								children: new ArrayDataSource([]),
								open: new DataSource(false)
							},
							{
								name: new DataSource('Created Models'),
								type: ProjectExplorerNodeType.ModelsFolder,
								permissions: {
									rename: false,
									delete: false
								},
								children: new ArrayDataSource([]),
								open: new DataSource(false)
							}
						])
					},
					{
						type: ProjectExplorerNodeType.CharacterFolder,
						name: new DataSource('Characters'),
						permissions: {
							rename: false,
							delete: false
						},
						open: new DataSource(true),
						children: new ArrayDataSource()
					},
					{
						type: ProjectExplorerNodeType.GlobalsFolder,
						name: new DataSource('Globals'),
						permissions: {
							rename: false,
							delete: false
						},
						open: new DataSource(true),
						children: new ArrayDataSource(crawl(join(folder, 'Globals'), ProjectExplorerNodeType.GlobalsFolder, ProjectExplorerNodeType.Globals))
					},
					{
						type: ProjectExplorerNodeType.StyleFolder,
						name: new DataSource('Style'),
						permissions: {
							rename: false,
							delete: false
						},
						open: new DataSource(true),
						children: new ArrayDataSource(crawl(join(folder, 'Style'), ProjectExplorerNodeType.StyleFolder, ProjectExplorerNodeType.Style))
					},
					{
						type: ProjectExplorerNodeType.EntityTemplateFolder,
						name: new DataSource('Entity Templates'),
						permissions: {
							rename: false,
							delete: false
						},
						open: new DataSource(true),
						children: new ArrayDataSource(
							crawl(join(folder, 'Entity Templates'), ProjectExplorerNodeType.EntityTemplateFolder, ProjectExplorerNodeType.EntityTemplate)
						)
					},
					{
						name: new DataSource('Tilemaps'),
						type: ProjectExplorerNodeType.TileMapFolder,
						permissions: {
							rename: false,
							delete: false
						},
						open: new DataSource(true),
						children: new ArrayDataSource()
					},
					{
						type: ProjectExplorerNodeType.TileSetFolder,
						name: new DataSource('Tilesets'),
						permissions: {
							rename: false,
							delete: false
						},
						open: new DataSource(true),
						children: new ArrayDataSource()
					},
					{
						type: ProjectExplorerNodeType.CodeFolder,
						name: new DataSource('Code'),
						permissions: {
							rename: false,
							delete: false
						},
						open: new DataSource(false),
						children: new ArrayDataSource(crawl(join(folder, 'Code'), ProjectExplorerNodeType.CodeFolder, ProjectExplorerNodeType.Code))
					},
					{
						type: ProjectExplorerNodeType.ComponentFolder,
						name: new DataSource('Components'),
						permissions: {
							rename: false,
							delete: false
						},
						open: new DataSource(false),
						children: new ArrayDataSource(
							crawl(join(folder, 'Components'), ProjectExplorerNodeType.ComponentFolder, ProjectExplorerNodeType.Component)
						)
					},
					{
						name: new DataSource('Assets'),
						type: ProjectExplorerNodeType.AssetFolder,
						permissions: {
							rename: false,
							delete: false
						},
						open: new DataSource(true),
						children: new ArrayDataSource([
							{
								type: ProjectExplorerNodeType.AssetFolder,
								name: new DataSource('Sound'),
								children: new ArrayDataSource(
									crawl(join(folder, 'Assets/Sound'), ProjectExplorerNodeType.AssetFolder, ProjectExplorerNodeType.Asset)
								),
								open: new DataSource(false),
								permissions: {
									rename: false,
									delete: false
								}
							},
							{
								type: ProjectExplorerNodeType.AssetFolder,
								name: new DataSource('Music'),
								children: new ArrayDataSource(
									crawl(join(folder, 'Assets/Music'), ProjectExplorerNodeType.AssetFolder, ProjectExplorerNodeType.Asset)
								),
								open: new DataSource(false),
								permissions: {
									rename: false,
									delete: false
								}
							},
							{
								type: ProjectExplorerNodeType.AssetFolder,
								name: new DataSource('Textures'),
								children: new ArrayDataSource(
									crawl(join(folder, 'Assets/Textures'), ProjectExplorerNodeType.AssetFolder, ProjectExplorerNodeType.Asset)
								),
								open: new DataSource(false),
								permissions: {
									rename: false,
									delete: false
								}
							},
							{
								type: ProjectExplorerNodeType.AssetFolder,
								name: new DataSource('Data'),
								children: new ArrayDataSource(
									crawl(join(folder, 'Assets/Data'), ProjectExplorerNodeType.AssetFolder, ProjectExplorerNodeType.Asset)
								),
								open: new DataSource(false),
								permissions: {
									rename: false,
									delete: false
								}
							}
						])
					},
					{
						type: ProjectExplorerNodeType.AnimationFolder,
						name: new DataSource('Animation'),
						children: new ArrayDataSource([
							{
								type: ProjectExplorerNodeType.AssetFolder,
								name: new DataSource('Statemachines'),
								children: new ArrayDataSource(),
								open: new DataSource(false),
								permissions: {
									rename: false,
									delete: false
								}
							},
							{
								type: ProjectExplorerNodeType.AssetFolder,
								name: new DataSource('Animations'),
								children: new ArrayDataSource(),
								open: new DataSource(false),
								permissions: {
									rename: false,
									delete: false
								}
							}
						]),
						permissions: {
							delete: false,
							rename: false
						},
						open: new DataSource(false)
					}
				]
			}
		]);

		this.connectParentReference(this.content.getData(), undefined);
	}

	private connectParentReference(nodes: ReadonlyArray<ProjectExplorerNode>, parent: ProjectExplorerNode): void {
		for (const node of nodes) {
			node.parent = new DataSource(parent);
			this.connectParentReference(getValueOf(node.children), node);
		}
	}

	public getFileOrFolderByNode(tag: ProjectExplorerNode): ProjectFile {
		if (tag === this.projectRootNode) {
			return undefined;
		}

		const path = this.getPathByNode(tag);

		return this.projectFileFromPath(path, tag.type);
	}

	public getPathByNode(tag: ProjectExplorerNode): string {
		if (tag === this.projectRootNode) {
			return this.folder;
		}

		const nodesPath = [tag];
		let ptr = tag;
		while (ptr.parent.value !== this.projectRootNode) {
			nodesPath.push(ptr.parent.value);
			ptr = ptr.parent.value;
		}
		const path = join(this.folder, ...nodesPath.reverse().map((e) => getValueOf(e.name)));
		return path;
	}

	public static isFolder(type: ProjectExplorerNodeType): boolean {
		switch (type) {
			case ProjectExplorerNodeType.CodeFolder:
			case ProjectExplorerNodeType.EntityTemplateFolder:
			case ProjectExplorerNodeType.ModelsFolder:
			case ProjectExplorerNodeType.SchemaFolder:
			case ProjectExplorerNodeType.StateMachineFolder:
			case ProjectExplorerNodeType.TileMapFolder:
			case ProjectExplorerNodeType.TileSetFolder:
			case ProjectExplorerNodeType.AssetFolder:
			case ProjectExplorerNodeType.SceneFolder:
			case ProjectExplorerNodeType.AnimationFolder:
			case ProjectExplorerNodeType.CharacterFolder:
			case ProjectExplorerNodeType.GeneratedCodeFolder:
			case ProjectExplorerNodeType.StyleFolder:
			case ProjectExplorerNodeType.GlobalsFolder:
			case ProjectExplorerNodeType.ComponentFolder:
				return true;
		}

		return false;
	}

	private convertFolderTypeToRegularType(type: ProjectExplorerNodeType): ProjectExplorerNodeType {
		switch (type) {
			case ProjectExplorerNodeType.CodeFolder:
				return ProjectExplorerNodeType.Code;
			case ProjectExplorerNodeType.ComponentFolder:
				return ProjectExplorerNodeType.Component;
			case ProjectExplorerNodeType.EntityTemplateFolder:
				return ProjectExplorerNodeType.EntityTemplate;
			case ProjectExplorerNodeType.ModelsFolder:
				return ProjectExplorerNodeType.Model;
			case ProjectExplorerNodeType.SchemaFolder:
				return ProjectExplorerNodeType.Schema;
			case ProjectExplorerNodeType.StateMachineFolder:
				return ProjectExplorerNodeType.StateMachine;
			case ProjectExplorerNodeType.TileMapFolder:
				return ProjectExplorerNodeType.TileMap;
			case ProjectExplorerNodeType.TileSetFolder:
				return ProjectExplorerNodeType.TileSet;
			case ProjectExplorerNodeType.AssetFolder:
				return ProjectExplorerNodeType.Asset;
			case ProjectExplorerNodeType.SceneFolder:
				return ProjectExplorerNodeType.Scene;
			case ProjectExplorerNodeType.AnimationFolder:
				return ProjectExplorerNodeType.Animation;
			case ProjectExplorerNodeType.CharacterFolder:
				return ProjectExplorerNodeType.Character;
			case ProjectExplorerNodeType.GeneratedCodeFolder:
				return ProjectExplorerNodeType.GeneratedCode;
			case ProjectExplorerNodeType.GlobalsFolder:
				return ProjectExplorerNodeType.Globals;
			case ProjectExplorerNodeType.StyleFolder:
				return ProjectExplorerNodeType.Style;
		}

		return type;
	}

	public getFileByPath(path: string): ProjectFile {
		const relativePath = relative(this.folder, path);
		if (relativePath.startsWith('.')) {
			return undefined;
		}

		const pathPieces = relativePath.split(sep);
		let projectFolder: ProjectExplorerNode = undefined;
		let projectFolderEntries = getValueOf(this.projectRootNode.children);

		for (const piece of pathPieces) {
			const folder = projectFolderEntries.find((e) => getValueOf(e.name) === piece);
			if (folder) {
				projectFolder = folder;
				projectFolderEntries = getValueOf(folder.children);
			} else {
				return undefined;
			}
		}

		return this.projectFileFromPath(path, this.convertFolderTypeToRegularType(projectFolder.type));
	}

	private projectFileFromPath(path: string, nodeType: ProjectExplorerNodeType) {
		let contentStream;
		if (!Project.isFolder(nodeType)) {
			contentStream = new DuplexDataSource(readFileSync(path, 'utf8'));
			contentStream.listenUpstream((v) => {
				writeFileSync(diskPathStream.value, v);
			});
		}
		const diskPathStream = new DuplexDataSource(path);

		if (!this.projectFiles.has(path)) {
			this.projectFiles.set(path, {
				content: contentStream,
				diskPath: diskPathStream,
				projectPath: new DuplexDataSource(relative(this.folder, path)),
				type: nodeType
			});
		}
		return this.projectFiles.get(path);
	}

	public save(to: string = this.folder): void {
		writeFileSync(
			join(to, 'project.json'),
			JSON.stringify(
				{
					name: this.name.value
				},
				undefined,
				4
			)
		);
	}
}
