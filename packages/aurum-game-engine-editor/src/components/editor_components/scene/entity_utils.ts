import { ModuleKind } from 'typescript';
import { baseEntitySchema, getSchema, ObjectSchema } from 'aurum-game-editor-api';
import { typescriptService } from '../../../services/typescript/typescript_service';
import { currentProject } from '../../../session/session';
import { SceneEntityDataReactive } from './scene_edit_model';
import { EntityTemplateModel } from 'aurum-game-editor-shared';
import { join } from 'path';

export function resolveSchema(entity: SceneEntityDataReactive): ObjectSchema {
	const schema = getSchema(entity.namespace);
	if (schema) {
		return schema;
	} else {
		const model: EntityTemplateModel = JSON.parse(currentProject.value.getFileByPath(join(currentProject.value.folder, entity.namespace)).content.value);
		try {
			const exported: any = {};
			new Function('exports', typescriptService.transpile(model.code, '', '', ModuleKind.CommonJS))(exported);
			if ('schema' in exported) {
				return {
					...exported.schema,
					...baseEntitySchema
				};
			} else {
				console.error(`No schema found in the entity template`);
				return undefined;
			}
		} catch (e) {
			console.error(e);
			return undefined;
		}
	}
}
