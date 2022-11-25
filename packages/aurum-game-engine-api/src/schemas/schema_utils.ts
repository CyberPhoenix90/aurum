import { ObjectSchema, baseEntitySchema } from './abstract.js';
import { labelEntitySchema } from './label.js';
import { panelEntitySchema } from './panel.js';
import { spriteEntitySchema } from './sprite.js';

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

    throw new Error(`Unknown namespace ${namespace}`);
}
