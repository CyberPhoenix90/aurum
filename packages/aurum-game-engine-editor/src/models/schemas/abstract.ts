import { Unit } from 'aurum-game-engine';
import { DataSource } from 'aurumjs';
import { Reactify } from '../../utils/types';

export interface ObjectSchema {
	[key: string]: SchemaField;
}

export interface ReactiveObjectSchema {
	[key: string]: DataSource<Reactify<SchemaField>>;
}

export enum SchemaFieldType {
	NUMBER,
	TEXT,
	BOOL,
	ENUM,
	COLOR,
	PERCENTAGE,
	ASSETS_FILE_PATH,
	ARRAY,
	OBJECT,
	CALLBACK,
	ENTITY_REFERENCE,
	COMPONENT,
	MULTIPLE_CHOICE,
	IMAGE,
	SOUND
}

export interface SchemaFieldTypeDescriptor<T extends SchemaFieldType> {
	type: T;
	validate?: (value: any) => boolean;
}

export interface NumberSchemaFieldTypeDescriptor extends SchemaFieldTypeDescriptor<SchemaFieldType.NUMBER> {
	allowedValues?: number[];
	validate?: (value: string) => boolean;
	integerOnly?: boolean;
	maxValue?: number;
	minValue?: number;
}

export interface TextSchemaFieldTypeDescriptor extends SchemaFieldTypeDescriptor<SchemaFieldType.TEXT> {
	allowedValues?: string[];
	validate?: (value: string) => boolean;
	maxLength?: number;
	minLength?: number;
}

export interface ArraySchemaFieldTypeDescriptor extends SchemaFieldTypeDescriptor<SchemaFieldType.ARRAY> {
	validate?: (array: any[]) => boolean;
	maxLength?: number;
	minLength?: number;
	allowedElementTypes: Array<SchemaFieldTypeDescriptor<any>>;
}

export interface ObjectSchemaFieldTypeDescriptor extends SchemaFieldTypeDescriptor<SchemaFieldType.OBJECT> {
	validate?: (object: any[]) => boolean;
	schema: ObjectSchema;
}

export interface EnumSchemaFieldTypeDescriptor extends SchemaFieldTypeDescriptor<SchemaFieldType.ENUM> {
	validate?: (object: any[]) => boolean;
	values: string[];
}

export interface MultipleChoiceSchemaFieldTypeDescriptor extends SchemaFieldTypeDescriptor<SchemaFieldType.MULTIPLE_CHOICE> {
	validate?: (object: any[]) => boolean;
	options: {
		label: string;
		schema: ObjectSchema;
	}[];
}

export interface SchemaField {
	tooltip: string;
	optional: boolean;
	allowedTypes: Array<
		| MultipleChoiceSchemaFieldTypeDescriptor
		| EnumSchemaFieldTypeDescriptor
		| ObjectSchemaFieldTypeDescriptor
		| ArraySchemaFieldTypeDescriptor
		| NumberSchemaFieldTypeDescriptor
		| TextSchemaFieldTypeDescriptor
		| SchemaFieldTypeDescriptor<any>
	>;
}

export const pointSchema: ObjectSchema = {
	x: {
		tooltip: 'X coordinate of the point',
		optional: false,
		allowedTypes: [
			{
				type: SchemaFieldType.NUMBER
			}
		]
	},
	y: {
		tooltip: 'Y coordinate of the point',
		optional: false,
		allowedTypes: [
			{
				type: SchemaFieldType.NUMBER
			}
		]
	}
};

export const baseEntitySchema: ObjectSchema = {
	name: {
		tooltip: 'Name of the entity in the scenegraph. Does not need to be unique',
		optional: false,
		allowedTypes: [
			{
				type: SchemaFieldType.TEXT,
				minLength: 1
			}
		]
	},
	x: {
		tooltip: 'Horizontal position of the entity on the screen relative to the parent entity in the scene graph',
		optional: false,
		allowedTypes: [
			{
				type: SchemaFieldType.TEXT,
				validate: (v) => Unit.isValidUnit(v)
			},
			{
				type: SchemaFieldType.NUMBER,
				integerOnly: true
			},
			{
				type: SchemaFieldType.CALLBACK
			}
		]
	},
	y: {
		tooltip: 'Vertical position of the entity on the screen relative to the parent entity in the scene graph',
		optional: false,
		allowedTypes: [
			{
				type: SchemaFieldType.TEXT,
				validate: (v) => Unit.isValidUnit(v)
			},
			{
				type: SchemaFieldType.NUMBER,
				integerOnly: true
			},
			{
				type: SchemaFieldType.CALLBACK
			}
		]
	},
	originX: {
		tooltip:
			'The horizontal point from which the entity is drawn. By default it is 0 which is left to right, 1 represents right to left. Decimal values or values beyond 0-1 range allowed',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.NUMBER
			}
		]
	},
	originY: {
		tooltip:
			'The vertical point from which the entity is drawn. By default it is 0 which is top to bottom, 1 represents bottom to top. Decimal values or values beyond 0-1 range allowed',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.NUMBER
			}
		]
	},
	clip: {
		tooltip: 'Whether or not the entity cuts off children that try to draw outside of its own borders',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.BOOL
			}
		]
	},
	ignoreLayout: {
		tooltip: 'Disobey the parent layout setting',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.BOOL
			}
		]
	},
	spreadLayout: {
		tooltip:
			'Propagate the layout of the parent to its children while implicitly ignoring the layout for itself. Useful to ignore wrapper elements and layout the wrapped elements instead',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.BOOL
			}
		]
	},
	width: {
		tooltip: 'The horizontal size of the entity',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.TEXT,
				allowedValues: ['auto', 'content', 'inherit', 'remainder']
			},
			{
				type: SchemaFieldType.TEXT,
				validate: (v) => Unit.isValidUnit(v)
			},
			{
				type: SchemaFieldType.NUMBER,
				minValue: 0
			},
			{
				type: SchemaFieldType.CALLBACK
			}
		]
	},
	height: {
		tooltip: 'The vertical size of the entity',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.TEXT,
				allowedValues: ['auto', 'content', 'inherit', 'remainder']
			},
			{
				type: SchemaFieldType.TEXT,
				validate: (v) => Unit.isValidUnit(v)
			},
			{
				type: SchemaFieldType.NUMBER,
				minValue: 0
			},
			{
				type: SchemaFieldType.CALLBACK
			}
		]
	},
	scaleX: {
		tooltip: 'Multiplier of the width. Can be useful to scale auto sizes. Decimal values allowed',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.NUMBER
			}
		]
	},
	scaleY: {
		tooltip: 'Multiplier of the height. Can be useful to scale auto sizes. Decimal values allowed',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.NUMBER
			}
		]
	},
	visible: {
		tooltip: 'Whether to render the entity and its children. Also affects bounding box and interaction',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.BOOL
			}
		]
	},
	alpha: {
		tooltip: 'Opacity of the entity',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.NUMBER,
				minValue: 0,
				maxValue: 1
			}
		]
	},
	layout: {
		tooltip: 'Rule for automatically positioning children',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.MULTIPLE_CHOICE,
				options: [
					{
						label: 'None',
						schema: {}
					},
					{
						label: 'Linear layout',
						schema: {
							initialOffset: {
								tooltip: 'Distance from the parent for the first child',
								optional: true,
								allowedTypes: [
									{
										type: SchemaFieldType.OBJECT,
										schema: pointSchema
									}
								]
							},
							nodeOffset: {
								tooltip: 'Distance of child to the child that came before it',
								optional: true,
								allowedTypes: [
									{
										type: SchemaFieldType.OBJECT,
										schema: pointSchema
									}
								]
							}
						}
					},
					{
						label: 'Grid layout',
						schema: {
							initialOffset: {
								tooltip: 'Distance from the parent for the first child',
								optional: true,
								allowedTypes: [
									{
										type: SchemaFieldType.OBJECT,
										schema: pointSchema
									}
								]
							},
							columnOffset: {
								tooltip: 'Distance that each column is moved from the previous one',
								optional: true,
								allowedTypes: [
									{
										type: SchemaFieldType.OBJECT,
										schema: pointSchema
									}
								]
							},
							rowOffset: {
								tooltip: 'Distance that each row is moved from the previous one',
								optional: true,
								allowedTypes: [
									{
										type: SchemaFieldType.OBJECT,
										schema: pointSchema
									}
								]
							},
							itemsPerRow: {
								tooltip: 'How many items before a new line or row is started',
								optional: false,
								allowedTypes: [
									{
										type: SchemaFieldType.NUMBER,
										integerOnly: true,
										minValue: 1
									}
								]
							}
						}
					}
				]
			}
		]
	},
	onAttach: {
		tooltip: 'Event that is fired when this entity enters the scene graph',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.CALLBACK
			}
		]
	},
	onDetach: {
		tooltip: 'Event that is fired when this entity exits the scene graph',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.CALLBACK
			}
		]
	}
};

// export interface AbstractEntitySchema {
// 	zIndex?: Data<number>;
// 	shaders?: Shader[] | ArrayDataSource<Shader>;
// 	blendMode?: Data<BlendModes>;
// 	rotation?: Data<number>;
// 	components?: MapDataSource<Constructor<AbstractComponent>, AbstractComponent> | AbstractComponent[];
// 	class?: CommonEntity[] | ArrayDataSource<CommonEntity>;
// 	layout?: AbstractLayout | DataSource<AbstractLayout>;
// }
