import { baseEntitySchema, ObjectSchema, SchemaFieldType } from './abstract';

export const spriteEntitySchema: ObjectSchema = {
	...baseEntitySchema,
	tint: {
		tooltip:
			'Applies a shader that multiplies the RBG values of each pixel of the texture with the RGB values of the tint thus allowing to filter out or weaken certain colors',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.COLOR
			}
		]
	},
	texture: {
		tooltip: 'Source for the image data from which this entity is drawn',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.IMAGE
			}
		]
	},
	drawOffsetX: {
		tooltip: 'Distance from the left side of the texture from which the drawing should begin',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.NUMBER,
				integerOnly: true,
				minValue: 0
			}
		]
	},
	drawOffsetY: {
		tooltip: 'Distance from the top side of the texture from which the drawing should begin',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.NUMBER,
				integerOnly: true,
				minValue: 0
			}
		]
	},
	drawDistanceX: {
		tooltip: 'How many pixels from the texture on the horizontal axis',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.NUMBER,
				integerOnly: true,
				minValue: 0
			}
		]
	},
	drawDistanceY: {
		tooltip: 'How many pixels from the texture on the vertical axis',
		optional: true,
		allowedTypes: [
			{
				type: SchemaFieldType.NUMBER,
				integerOnly: true,
				minValue: 0
			}
		]
	}
};
