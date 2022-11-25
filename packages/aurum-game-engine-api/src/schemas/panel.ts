import { baseEntitySchema, ObjectSchema, SchemaFieldType } from './abstract.js';

export const panelEntitySchema: ObjectSchema = {
    ...baseEntitySchema,
    background: {
        optional: true,
        tooltip: 'Color of the background',
        allowedTypes: [
            {
                type: SchemaFieldType.COLOR
            }
        ]
    }
};
