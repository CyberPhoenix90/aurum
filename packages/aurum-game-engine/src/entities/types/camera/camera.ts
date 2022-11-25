import { ArrayDataSource, AurumComponentAPI, DataSource, Renderable } from 'aurumjs';
import { render } from '../../../core/custom_aurum_renderer.js';
import { CommonEntityProps } from '../../../models/entities.js';
import { Data } from '../../../models/input_data.js';
import { SceneGraphNode } from '../../../models/scene_graph.js';
import { toSourceIfDefined } from '../../../utilities/data/to_source.js';
import { entityDefaults } from '../../entity_defaults.js';
import { normalizeComponents, propsToModel } from '../../shared.js';
import { CameraGraphNode } from './api.js';
import { CameraEntity } from './model.js';

export interface CameraProps extends CommonEntityProps {
    resolutionX?: Data<number>;
    resolutionY?: Data<number>;
    backgroundColor?: Data<string>;
    onAttach?(node: CameraGraphNode): void;
    onDetach?(node: CameraGraphNode): void;
    class?: CameraEntity[] | ArrayDataSource<CameraEntity>;
}

export function Camera(props: CameraProps, children: Renderable[], api: AurumComponentAPI): SceneGraphNode<CameraEntity> {
    return new CameraGraphNode({
        name: props.name ?? CameraGraphNode.name,
        components: normalizeComponents(props.components),
        cancellationToken: api.cancellationToken,
        children: new ArrayDataSource(
            render(children, {
                attachCalls: [],
                sessionToken: undefined,
                tokens: []
            })
        ),
        models: {
            coreDefault: entityDefaults,
            appliedStyleClasses: props.class instanceof ArrayDataSource ? props.class : new ArrayDataSource(props.class),
            entityTypeDefault: cameraDefaultModel,
            userSpecified: {
                ...propsToModel(props),
                backgroundColor: toSourceIfDefined(props.backgroundColor),
                resolutionX: toSourceIfDefined(props.resolutionX),
                resolutionY: toSourceIfDefined(props.resolutionY)
            }
        },
        onAttach: props.onAttach,
        onDetach: props.onDetach
    });
}

export const cameraDefaultModel: CameraEntity = {
    backgroundColor: new DataSource('black'),
    resolutionX: new DataSource(undefined),
    resolutionY: new DataSource(undefined)
};
