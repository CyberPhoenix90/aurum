import { css } from '@emotion/css';
import { aurumify, Button, currentTheme, DropDownMenu, DropDownMenuOption, NumberField, TextField, TreeEntry, TreeViewComponent } from 'aurum-components';
import { ArrayDataSource, Aurum, DataSource, dsDiff, dsTap, getValueOf, Renderable, Switch, SwitchCase } from 'aurumjs';
import { ObjectSchema, SchemaField, SchemaFieldType } from '../../models/schemas/abstract';
import { Reactify } from '../../utils/types';
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

			label {
				display: flex;
			}
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
							renderable: (
								<SchemaFieldEditor name={name} onDelete={() => root.children.remove(newFieldEntry)} field={undefined}></SchemaFieldEditor>
							),
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
	field: Reactify<SchemaField>;
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
			<DropDownMenu<SchemaFieldType> selectedValue={props.field.allowedTypes.get(0).type} dialogSource={dialogs}>
				<DropDownMenuOption value={undefined}>None</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.TEXT}>Text</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.NUMBER}>Number</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.IMAGE}>Image</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.SOUND}>Sound</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.COLOR}>Color</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.COMPONENT}>Component</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.ARRAY}>Array</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.OBJECT}>Object</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.BOOL}>Boolean</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.CALLBACK}>Callback</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.ENTITY_REFERENCE}>Entity Reference</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.ENUM}>Enum</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.MULTIPLE_CHOICE}>One of</DropDownMenuOption>
				<DropDownMenuOption value={SchemaFieldType.PERCENTAGE}>Percentage</DropDownMenuOption>
			</DropDownMenu>
			<Switch state={undefined}>
				<SwitchCase when={SchemaFieldType.TEXT}>
					<div>
						<label>
							DefaultValue:<TextField style="width:100%"></TextField>
						</label>
					</div>
					<div>
						<label>
							MinLength:<NumberField style="width:100%"></NumberField>
						</label>
					</div>
					<div>
						<label>
							MaxLength:<NumberField style="width:100%"></NumberField>
						</label>
					</div>
				</SwitchCase>
			</Switch>
		</div>
	);
}
