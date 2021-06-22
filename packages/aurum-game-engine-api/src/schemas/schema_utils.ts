import { ObjectSchema, baseEntitySchema } from './abstract';
import { labelEntitySchema } from './label';
import { panelEntitySchema } from './panel';
import { spriteEntitySchema } from './sprite';

export function getSchema(namespace: string): ObjectSchema {
	if (namespace.startsWith('@internal/')) {
		switch (namespace.split('/')[1]) {
			case 'container':
				return baseEntitySchema;
			case 'label':
				return labelEntitySchema;
			case 'sprite':
				return spriteEntitySchema;
			case 'panel':
				return panelEntitySchema;
		}
	}
}
