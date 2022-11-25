import { ArrayDataSource, DataSource } from 'aurumjs';
import { SceneEntityData } from 'aurum-game-editor-shared';
import { SceneEntityDataReactive } from '../../components/editor_components/scene/scene_edit_model.js';

export function setParentsForSceneModel(
    entities: ArrayDataSource<SceneEntityDataReactive>,
    parent?: SceneEntityDataReactive
): ArrayDataSource<SceneEntityDataReactive> {
    for (const entity of entities) {
        entity.parent.update(parent);
        if (entity.children?.length?.value) {
            setParentsForSceneModel(entity.children, entity);
        }
    }

    return entities;
}

export function reactifySceneModel(entities: SceneEntityData[]): ArrayDataSource<SceneEntityDataReactive> {
    return new ArrayDataSource(
        entities.map((e) => {
            const reactiveProps = {};
            for (const key in e.properties) {
                reactiveProps[key] = new DataSource(e.properties[key]);
            }

            const tmp: SceneEntityDataReactive = {
                namespace: e.namespace,
                name: new DataSource(e.name),
                parent: new DataSource(),
                properties: reactiveProps,
                children: reactifySceneModel(e.children)
            };

            if ('innerText' in e) {
                tmp.innerText = new DataSource(e.innerText);
            }

            return tmp;
        })
    );
}
