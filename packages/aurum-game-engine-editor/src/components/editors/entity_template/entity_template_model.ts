import { ArrayDataSource, DuplexDataSource } from 'aurumjs';
import { SceneEntityDataReactive } from '../../editor_components/scene/scene_edit_model';

export interface EntityTemplateModelReactive {
	code: DuplexDataSource<string>;
	entities: ArrayDataSource<SceneEntityDataReactive>;
}
