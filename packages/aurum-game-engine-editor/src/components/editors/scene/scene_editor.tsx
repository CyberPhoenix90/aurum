import { css } from '@emotion/css';
import { aurumify, Button, currentTheme, PanelComponent, PanelContent, PanelDockBottom, PanelDockLeft, PanelDockRight } from 'aurum-components';
import { SceneEntityData, SceneModel } from 'aurum-game-editor-shared';
import {
	ArrayDataSource,
	Aurum,
	AurumComponentAPI,
	DataSource,
	DefaultSwitchCase,
	dsFilter,
	dsMap,
	DuplexDataSource,
	Renderable,
	Switch,
	SwitchCase
} from 'aurumjs';
import { ProjectFile } from '../../../models/project_file';
import { reactifySceneModel, setParentsForSceneModel } from '../../../models/scene_entities/reactive_entities_utils';
import { EntityPicker, EntityTypeTreeNode } from '../../editor_components/entity_picker/entity_picker';
import { CameraControls } from '../../editor_components/scene/camera_controls';
import { resolveSchema } from '../../editor_components/scene/entity_utils';
import { SceneGrid } from '../../editor_components/scene/grid';
import { GridControls } from '../../editor_components/scene/grid_controls';
import { SceneEntityDataReactive, SceneModelReactive } from '../../editor_components/scene/scene_edit_model';
import { SceneGraphView } from '../../editor_components/scene/scene_graph_view';
import { ScenePreview } from '../../editor_components/scene/scene_preview';
import { popups } from '../../popups/popups';
import { ProjectExplorerNodeType } from '../../project_explorer/model';
import { AbstractEditorProps } from '../abstract';
import { CodeEditor } from '../code/code_editor';
import { EntityEditor, sceneEntityToEntityEditor } from './entity_editor';
import { SceneSettingsPopup } from './scene_settings_popup';

export interface SceneEditorProps extends AbstractEditorProps {}

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

export function SceneEditor(props: SceneEditorProps, children: Renderable[], api: AurumComponentAPI) {
	props.onSuspend?.subscribe(() => {
		props.input.content.updateUpstream(JSON.stringify(save(modelReactive), undefined, 4));
	}, api.cancellationToken);

	props.onSaveRequested?.subscribe(() => {
		props.input.content.updateUpstream(JSON.stringify(save(modelReactive), undefined, 4));
	}, api.cancellationToken);

	const sizeX = new DataSource<number>();
	const sizeY = new DataSource<number>();
	const posX = new DuplexDataSource(0);
	const posY = new DuplexDataSource(0);
	const zoom = new DuplexDataSource(1);
	const model: SceneModel = JSON.parse(props.input.content.value);
	const modelReactive: SceneModelReactive = {
		code: new DuplexDataSource(model.code),
		settings: model.settings ?? {
			backgroundMusic: undefined
		},
		cameraEntities: setParentsForSceneModel(reactifySceneModel(model.cameraEntities ?? [])),
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
				<div class="scene-settings">
					<Button
						onClick={() =>
							popups.push(
								<SceneSettingsPopup
									onApply={(newSettings) => {
										modelReactive.settings = newSettings;
										save(modelReactive);
									}}
									sceneSettings={modelReactive.settings}
								></SceneSettingsPopup>
							)
						}
					>
						⚙ Scene Settings
					</Button>
				</div>
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
									name: 'sceneRoot'
								},
								{
									data: modelReactive.cameraEntities,
									name: 'cameraRoot'
								}
							]}
						></SceneGraphView>
					</PanelDockLeft>
					<PanelDockBottom resizable size={300}>
						<CodeEditor input={codeFile} openFile={props.openFile}></CodeEditor>
					</PanelDockBottom>
					<PanelDockRight resizable size={300}>
						<Switch state={editTarget}>
							<SwitchCase when={undefined}>No entity selected</SwitchCase>
							<DefaultSwitchCase>
								<EntityEditor
									editTarget={editTarget.transform(
										dsFilter((e) => !!e),
										dsMap((entity) => {
											return sceneEntityToEntityEditor(entity, resolveSchema(entity));
										})
									)}
								></EntityEditor>
							</DefaultSwitchCase>
						</Switch>
					</PanelDockRight>
					<PanelContent>
						<ScenePreview
							grid={grid}
							editTarget={editTarget}
							cameraEntities={modelReactive.cameraEntities}
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

function save(modelReactive: SceneModelReactive): SceneModel {
	return {
		code: modelReactive.code.value,
		settings: modelReactive.settings,
		cameraEntities: saveEntities(modelReactive.cameraEntities),
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
