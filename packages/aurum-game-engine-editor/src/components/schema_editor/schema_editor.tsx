import { css } from '@emotion/css';
import { aurumify, Button, currentTheme, TreeEntry, TreeViewComponent, DropDownMenu, DropDownMenuOption } from 'aurum-components';
import { ArrayDataSource, Aurum, DataSource, dsDiff, dsTap, getValueOf, Renderable } from 'aurumjs';
import { ObjectSchema, SchemaField } from '../../models/schemas/abstract';
import { dialogs } from '../dialogs/dialogs';

export interface SchemaEditorProps {
	schema: DataSource<ObjectSchema>;
}

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
	aurumify(
		[theme.fontFamily, theme.baseFontSize, theme.highlightFontColor, theme.themeColor1],
		(fontFamily, size, highlightFont, color1) => css`
			display: flex;
			height: 100%;
			flex-direction: column;
			background-color: ${color1};
			font-family: ${fontFamily};
			font-size: ${size};
			color: ${highlightFont};
			background-color: ${color1};
		`,
		lifecycleToken
	)
);

export function SchemaEditor(props: SchemaEditorProps) {
	const renamingTarget = new DataSource<TreeEntry<SchemaField>>();
	renamingTarget.transform(
		dsDiff(),
		dsTap(({ newValue, oldValue }) => {
			if (oldValue && !getValueOf(oldValue.name)) {
				root.children.remove(oldValue);
			}
		})
	);
	const schemaFields = new ArrayDataSource<TreeEntry<SchemaField>>();
	const root = {
		renderable: (
			<div style="display:flex;">
				<p style="margin:6px;">root</p>{' '}
				<Button
					onClick={(e) => {
						const name = new DataSource('');
						e.stopPropagation();
						const field: SchemaField = {
							optional: false,
							allowedTypes: [],
							tooltip: ''
						};
						const newFieldEntry: TreeEntry<SchemaField> = {
							name,
							renderable: <SchemaFieldEditor name={name} onDelete={() => root.children.remove(newFieldEntry)} field={field}></SchemaFieldEditor>,
							tag: field
						};
						schemaFields.push(newFieldEntry);
						root.open.update(true);
						renamingTarget.update(newFieldEntry);
					}}
				>
					+
				</Button>
			</div>
		),
		name: 'root',
		children: schemaFields,
		open: new DataSource(true)
	};

	return (
		<div class={style}>
			<div>Entity Template Schema</div>
			<TreeViewComponent<SchemaField> renaming={renamingTarget} entries={new ArrayDataSource([root])}></TreeViewComponent>
		</div>
	);
}

interface SchemaFieldEditorProps {
	name: DataSource<string>;
	field: SchemaField;
	onDelete(): void;
}

function SchemaFieldEditor(props: SchemaFieldEditorProps): Renderable {
	return (
		<div style="width:100%; margin:8px;">
			<div style="display:flex; justify-content:space-between;">
				{props.name}
				<Button onClick={() => props.onDelete()}>×</Button>
			</div>
			Allowed Types:
			<DropDownMenu dialogSource={dialogs}>
				<DropDownMenuOption value={0}>None</DropDownMenuOption>
				<DropDownMenuOption value={1}>Text</DropDownMenuOption>
				<DropDownMenuOption value={2}>Number</DropDownMenuOption>
			</DropDownMenu>
		</div>
	);
}
