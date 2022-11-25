import { ArrayDataSource, DuplexDataSource } from 'aurumjs';
import { SceneEntityDataReactive } from '../../editor_components/scene/scene_edit_model.js';

export interface EntityTemplateModelReactive {
    code: DuplexDataSource<string>;
    entities: ArrayDataSource<SceneEntityDataReactive>;
}
