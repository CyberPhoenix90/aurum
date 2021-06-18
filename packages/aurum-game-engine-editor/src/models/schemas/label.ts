import { baseEntitySchema, ObjectSchema, SchemaFieldType } from './abstract';

export const labelEntitySchema: ObjectSchema = {
	...baseEntitySchema,
	color: {
		tooltip: 'Color of the text',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.COLOR
			}
		]
	},
	text: {
		tooltip: 'Text content of the label',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.TEXT
			}
		]
	}
};
