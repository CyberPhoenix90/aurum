import { css } from '@emotion/css';
import { aurumify, currentTheme, PanelComponent, PanelContent, PanelDockBottom, PanelDockLeft, PanelDockRight } from 'aurum-components';
import {
	ArrayDataSource,
	Aurum,
	AurumComponentAPI,
	DataSource,
	DefaultSwitchCase,
	dsFilter,
	dsMap,
	DuplexDataSource,
	EventEmitter,
	Renderable,
	Switch,
	SwitchCase
} from 'aurumjs';
import { SceneEntityData, EntityTemplateModel } from 'aurum-game-editor-shared';
import { ProjectFile } from '../../../models/project_file';
import { reactifySceneModel, setParentsForSceneModel } from '../../../models/scene_entities/reactive_entities_utils';
import { getSchema } from '../../../models/schemas/schema_utils';
import { EntityPicker, EntityTypeTreeNode } from '../../editor_components/entity_picker/entity_picker';
import { CameraControls } from '../../editor_components/scene/camera_controls';
import { SceneGrid } from '../../editor_components/scene/grid';
import { GridControls } from '../../editor_components/scene/grid_controls';
import { SceneEntityDataReactive } from '../../editor_components/scene/scene_edit_model';
import { SceneGraphView } from '../../editor_components/scene/scene_graph_view';
import { ScenePreview } from '../../editor_components/scene/scene_preview';
import { DragSession } from '../../editor_components/scene/scene_renderer';
import { ProjectExplorerNodeType } from '../../project_explorer/model';
import { SchemaEditor } from '../../schema_editor/schema_editor';
import { AbstractEditorProps } from '../abstract';
import { CodeEditor } from '../code/code_editor';
import { EntityEditor, sceneEntityToEntityEditor } from '../scene/entity_editor';
import { EntityTemplateModelReactive } from './entity_template_model';

export interface EntityTemplateEditorProps extends AbstractEditorProps {}

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
	aurumify(
		[theme.fontFamily, theme.baseFontSize, theme.highlightFontColor, theme.themeColor1],
		(fontFamily, size, highlightFont, color1) => css`
			background-color: ${color1};
			font-family: ${fontFamily};
			font-size: ${size};
			color: ${highlightFont};
			overflow: hidden;

			width: 100%;
			height: 100%;
			flex-direction: column;
			display: flex;

			.entity-editor {
				background-color: ${color1};
			}

			.scene-editor-header {
				align-items: center;
				display: flex;
				margin: 8px;
			}

			.text-field {
				width: 80px;
			}

			.scene-settings {
				margin-right: 8px;
			}

			.scene-editor-camera-controls {
				margin-right: 8px;
			}

			.scene-editor-content {
				display: flex;
				width: 100%;
				height: 100%;
			}
		`,
		lifecycleToken
	)
);

export function EntityTemplateEditor(props: EntityTemplateEditorProps, children: Renderable[], api: AurumComponentAPI) {
	props.onSuspend.subscribe(() => {
		props.input.content.updateUpstream(JSON.stringify(save(modelReactive), undefined, 4));
	}, api.cancellationToken);

	props.onSaveRequested.subscribe(() => {
		props.input.content.updateUpstream(JSON.stringify(save(modelReactive), undefined, 4));
	}, api.cancellationToken);

	const sizeX = new DataSource<number>();
	const sizeY = new DataSource<number>();
	const posX = new DuplexDataSource(0);
	const posY = new DuplexDataSource(0);
	const zoom = new DuplexDataSource(1);
	const model: EntityTemplateModel = JSON.parse(props.input.content.value);
	const modelReactive: EntityTemplateModelReactive = {
		code: new DuplexDataSource(model.code),
		entities: setParentsForSceneModel(reactifySceneModel(model.entities))
	};

	const grid: SceneGrid = {
		xSpace: new DuplexDataSource<number>(32),
		ySpace: new DuplexDataSource<number>(32),
		render: new DuplexDataSource<boolean>(true),
		color: new DuplexDataSource<string>('#ddd'),
		snap: new DuplexDataSource<boolean>(false)
	};

	const editTarget = new DataSource<SceneEntityDataReactive>();
	const codeFile: ProjectFile = {
		content: modelReactive.code,
		diskPath: props.input.diskPath,
		projectPath: props.input.projectPath,
		type: ProjectExplorerNodeType.Code
	};

	return (
		<div class={style}>
			<div class="scene-editor-header">
				<CameraControls posX={posX} posY={posY} zoom={zoom}></CameraControls>
				<GridControls {...grid}></GridControls>
			</div>
			<div class="scene-editor-content">
				<PanelComponent>
					<PanelDockLeft resizable size={200}>
						<EntityPicker
							onEntryDoubleClicked={(entry: EntityTypeTreeNode) => {
								if (entry) {
									modelReactive.entities.push(entry.entityFactory());
								}
							}}
						></EntityPicker>
						<SceneGraphView
							editTarget={editTarget}
							rootNodes={[
								{
									data: modelReactive.entities,
									name: 'templateRoot'
								}
							]}
						></SceneGraphView>
					</PanelDockLeft>
					<PanelDockBottom resizable size={300}>
						<CodeEditor input={codeFile} onSaveRequested={new EventEmitter()} onSuspend={new EventEmitter()} openFile={props.openFile}></CodeEditor>
					</PanelDockBottom>
					<PanelDockRight resizable size={300}>
						<div class="entity-editor" style="height:50%">
							<Switch state={editTarget}>
								<SwitchCase when={undefined}>No entity selected</SwitchCase>
								<DefaultSwitchCase>
									<EntityEditor
										editTarget={editTarget.transform(
											dsFilter((e) => !!e),
											dsMap((entity) => {
												return sceneEntityToEntityEditor(entity, getSchema(entity.namespace));
											})
										)}
									></EntityEditor>
								</DefaultSwitchCase>
							</Switch>
						</div>
						<div style="height:50%">
							<SchemaEditor schema={new DataSource()}></SchemaEditor>
						</div>
					</PanelDockRight>
					<PanelContent>
						<ScenePreview
							grid={grid}
							editTarget={editTarget}
							sceneEntities={modelReactive.entities}
							cameraX={posX}
							cameraY={posY}
							allowDrag
							resolutionX={sizeX}
							resolutionY={sizeY}
							zoom={zoom}
						></ScenePreview>
					</PanelContent>
				</PanelComponent>
			</div>
		</div>
	);
}

export interface SceneRendererProps {
	selected: DataSource<SceneEntityDataReactive>;
	dragSession: DataSource<DragSession>;
	model: ArrayDataSource<SceneEntityDataReactive>;
}

function save(modelReactive: EntityTemplateModelReactive): EntityTemplateModel {
	return {
		code: modelReactive.code.value,
		entities: saveEntities(modelReactive.entities)
	};
}

function saveEntities(entities: ArrayDataSource<SceneEntityDataReactive>): SceneEntityData[] {
	return entities.getData().map((s) => {
		const staticProps = {};
		for (const key in s.properties) {
			staticProps[key] = s.properties[key].value;
		}

		return {
			children: saveEntities(s.children),
			name: s.name.value,
			innerText: s.innerText?.value,
			namespace: s.namespace,
			properties: staticProps
		};
	});
}
