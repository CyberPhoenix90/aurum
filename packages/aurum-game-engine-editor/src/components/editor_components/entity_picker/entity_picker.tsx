import { TreeEntry, TreeViewComponent } from 'aurum-components';
import { ArrayDataSource, Aurum, DataSource, Renderable } from 'aurumjs';
import { SceneEntityDataReactive } from '../scene/scene_edit_model';

export interface EntityTypeTreeNode {
	entityFactory: () => SceneEntityDataReactive;
}

export interface EntityPickerProps {
	onEntryDoubleClicked(entry: EntityTypeTreeNode): void;
}

export function EntityPicker(props: EntityPickerProps): Renderable {
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
						children: new ArrayDataSource([]),
						open: new DataSource(true)
					}
				])
			}
			allowFocus
		></TreeViewComponent>
	);
}
