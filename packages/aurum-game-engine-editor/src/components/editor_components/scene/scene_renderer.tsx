import { Canvas, Container, Label, MapLike, MouseInteractionComponent, Panel, ReactiveRectangle, SceneGraphNode, Sprite } from 'aurum-game-engine';
import { ArrayDataSource, Aurum, DataSource, dsMap, Renderable } from 'aurumjs';
import { join } from 'path';
import { EntityTemplateModel } from '../../../../../aurum-game-editor-shared/prebuilt/esnext/entity_template.js';
import { setParentsForSceneModel, reactifySceneModel } from '../../../models/scene_entities/reactive_entities_utils.js';
import { currentProject } from '../../../session/session.js';
import { fileUrl } from '../../../utils/url.js';
import { SceneEntityDataReactive } from './scene_edit_model.js';

export interface DragSession {
    dragStartX: number;
    dragStartY: number;
    initPosX: number;
    initPosY: number;
    target: SceneEntityDataReactive;
}

export interface SceneRendererProps {
    selected?: DataSource<SceneEntityDataReactive>;
    dragSession?: DataSource<DragSession>;
    model: ArrayDataSource<SceneEntityDataReactive>;
}

export function SceneRenderer(props: SceneRendererProps) {
    const renderableToEntity: Map<SceneEntityDataReactive, SceneGraphNode<any>> = new Map();
    return (
        <Container name="SceneRendererWrapper" width="content" height="content">
            {props.model.map((renderable) => renderSceneEntity(renderable, renderableToEntity, props.selected, props.dragSession))}
            {props.selected ? (
                <Container>
                    {props.selected.transform(
                        dsMap((selected) => {
                            if (selected) {
                                if (!renderableToEntity.has(props.selected.value)) {
                                    return;
                                }
                                return (
                                    <Canvas
                                        paintOperations={[
                                            {
                                                strokeStyle: 'white',
                                                strokeThickness: 1,
                                                shape: new ReactiveRectangle(
                                                    {
                                                        x: renderableToEntity.get(props.selected.value)?.renderState.x as DataSource<number>,
                                                        y: renderableToEntity.get(props.selected.value)?.renderState.y as DataSource<number>
                                                    },
                                                    {
                                                        x: renderableToEntity.get(props.selected.value).renderState.width as DataSource<number>,
                                                        y: renderableToEntity.get(props.selected.value).renderState.height as DataSource<number>
                                                    }
                                                )
                                            }
                                        ]}
                                    ></Canvas>
                                );
                            }
                        })
                    )}
                </Container>
            ) : undefined}
        </Container>
    );
}

function renderSceneEntity(
    model: SceneEntityDataReactive,
    renderableToEntity: Map<SceneEntityDataReactive, SceneGraphNode<any>>,
    selected?: DataSource<SceneEntityDataReactive>,
    dragSession?: DataSource<DragSession>
): Renderable {
    const ctr = selectConstructor(model.namespace, model.children);
    if (!ctr) {
        console.warn(`Entity ${model.namespace} could not be resolved`);
        return undefined;
    }

    return Aurum.factory(
        ctr,
        {
            components: [
                dragSession
                    ? new MouseInteractionComponent({
                          onMouseDown: (e) => {
                              e.e.stopPropagation();
                              selected?.update(model);
                              dragSession.update({
                                  target: model,
                                  dragStartX: e.e.clientX,
                                  dragStartY: e.e.clientY,
                                  initPosX: model.properties.x.value,
                                  initPosY: model.properties.y.value
                              });
                          }
                      })
                    : undefined
            ],
            onAttach: (node) => {
                renderableToEntity.set(model, node);
            },
            name: model.name,
            ...postProcessProperties(model.properties)
        },
        model.innerText ? model.innerText : model.children.map((m) => renderSceneEntity(m, renderableToEntity, selected, dragSession))
    );
}

function selectConstructor(namespace: string, children: ArrayDataSource<SceneEntityDataReactive>): any {
    if (namespace.startsWith('@internal/')) {
        switch (namespace.split('/')[1]) {
            case 'container':
                return Container;
            case 'label':
                return Label;
            case 'sprite':
                return Sprite;
            case 'panel':
                return Panel;
        }
    } else {
        const model: EntityTemplateModel = JSON.parse(currentProject.value.getFileByPath(join(currentProject.value.folder, namespace)).content.value);
        return (props) => (
            <Container name="EntityTemplateWrapper" width="content" height="content" {...props}>
                <SceneRenderer model={setParentsForSceneModel(reactifySceneModel(model.entities))}></SceneRenderer>
                <SceneRenderer model={children}></SceneRenderer>
            </Container>
        );
    }
}

function postProcessProperties(properties: { [key: string]: DataSource<any> }): MapLike<any> {
    const result = { ...properties };

    if (properties.texture) {
        result.texture = properties.texture.transform(dsMap((s) => fileUrl(join(currentProject.value.folder, 'Assets', s))));
    }

    return result;
}
