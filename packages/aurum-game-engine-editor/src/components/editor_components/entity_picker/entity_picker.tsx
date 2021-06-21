import { TreeEntry, TreeViewComponent } from 'aurum-components';
import { ArrayDataSource, Aurum, AurumComponentAPI, DataSource, dsMap, Renderable } from 'aurumjs';
import { join, parse, relative } from 'path';
import { ProjectRootFolders } from '../../../models/project';
import { currentProject } from '../../../session/session';
import { SceneEntityDataReactive } from '../scene/scene_edit_model';

export interface EntityTypeTreeNode {
	entityFactory: () => SceneEntityDataReactive;
}

export interface EntityPickerProps {
	onEntryDoubleClicked(entry: EntityTypeTreeNode): void;
}

export function EntityPicker(props: EntityPickerProps, children: Renderable[], api: AurumComponentAPI): Renderable {
	return (
		<TreeViewComponent<EntityTypeTreeNode>
			onEntryDoubleClicked={(e, entry) => {
				props.onEntryDoubleClicked(entry.tag);
			}}
			style="height:50%"
			entries={
				new ArrayDataSource([
					{
						name: 'builtin entities',
						children: new ArrayDataSource<TreeEntry<EntityTypeTreeNode>>([
							{
								name: 'container',
								tag: {
									entityFactory: () => ({
										parent: new DataSource(),
										name: new DataSource('container'),
										children: new ArrayDataSource(),
										namespace: '@internal/container',
										properties: {
											x: new DataSource(0),
											y: new DataSource(0),
											scaleX: new DataSource(1),
											scaleY: new DataSource(1)
										}
									})
								}
							},
							{
								name: 'label',
								tag: {
									entityFactory: () => ({
										parent: new DataSource(),
										name: new DataSource('label'),
										children: new ArrayDataSource(),
										namespace: '@internal/label',
										innerText: new DataSource('New Label'),
										properties: {
											color: new DataSource('white'),
											x: new DataSource(0),
											y: new DataSource(0),
											scaleX: new DataSource(1),
											scaleY: new DataSource(1)
										}
									})
								}
							},
							{
								name: 'sprite',
								tag: {
									entityFactory: () => ({
										parent: new DataSource(),
										name: new DataSource('sprite'),
										children: new ArrayDataSource(),
										namespace: '@internal/sprite',
										properties: {
											tint: new DataSource('white'),
											x: new DataSource(0),
											y: new DataSource(0),
											scaleX: new DataSource(1),
											scaleY: new DataSource(1),
											texture: new DataSource(),
											drawOffsetX: new DataSource(0),
											drawOffsetY: new DataSource(0),
											drawDistanceX: new DataSource(),
											drawDistanceY: new DataSource()
										}
									})
								}
							},
							{
								name: 'panel',
								tag: {
									entityFactory: () => ({
										parent: new DataSource(),
										name: new DataSource('panel'),
										children: new ArrayDataSource(),
										namespace: '@internal/panel',
										properties: {
											x: new DataSource(0),
											y: new DataSource(0),
											scaleX: new DataSource(1),
											scaleY: new DataSource(1),
											background: new DataSource(),
											margin: new DataSource(),
											padding: new DataSource()
										}
									})
								}
							}
						]),
						open: new DataSource(true)
					},
					{
						name: 'project entities',
						children: currentProject.value.watchFolderByPathRecursively(ProjectRootFolders.EntityTemplates, api.cancellationToken).map((e) => ({
							name: e.diskPath.transform(dsMap((e) => relative(join(currentProject.value.folder, ProjectRootFolders.EntityTemplates), e))),
							tag: {
								entityFactory: () => ({
									parent: new DataSource(),
									name: new DataSource(parse(e.diskPath.value).name),
									children: new ArrayDataSource(),
									namespace: relative(currentProject.value.folder, e.diskPath.value),
									properties: {
										x: new DataSource(0),
										y: new DataSource(0),
										scaleX: new DataSource(1),
										scaleY: new DataSource(1)
									}
								})
							}
						})),
						open: new DataSource(true)
					}
				])
			}
			allowFocus
		></TreeViewComponent>
	);
}
