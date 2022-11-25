import { ArrayDataSource, AurumComponentAPI, DataSource } from 'aurumjs';
import { CommonEntityProps } from '../../../models/entities.js';
import { CanvasGraphNode } from './api.js';
import { AbstractShape } from '../../../math/shapes/abstract_shape.js';
import { Data } from '../../../models/input_data.js';
import { normalizeComponents, propsToModel } from '../../shared.js';
import { entityDefaults } from '../../entity_defaults.js';
import { CanvasEntity } from './model.js';
import { AbstractReactiveShape } from '../../../math/reactive_shapes/abstract_reactive_shape.js';

export interface PaintOperation {
    shape?: AbstractShape | AbstractReactiveShape;
    strokeAlignment?: number;
    strokeStyle?: Data<string>;
    fillStyle?: Data<string>;
    strokeThickness?: Data<number>;
}

export interface CanvasEntityProps extends CommonEntityProps {
    paintOperations?: PaintOperation[] | ArrayDataSource<PaintOperation>;
    onAttach?(node: CanvasGraphNode): void;
    onDetach?(node: CanvasGraphNode): void;
}

export function Canvas(props: CanvasEntityProps, _, api: AurumComponentAPI): CanvasGraphNode {
    return new CanvasGraphNode({
        name: props.name ?? CanvasGraphNode.name,
        components: normalizeComponents(props.components),
        children: undefined,
        cancellationToken: api.cancellationToken,
        models: {
            coreDefault: entityDefaults,
            appliedStyleClasses: props.class instanceof ArrayDataSource ? props.class : new ArrayDataSource(props.class),
            entityTypeDefault: canvasDefaultModel,
            userSpecified: {
                ...propsToModel(props),
                paintOperations: props.paintOperations
                    ? props.paintOperations instanceof ArrayDataSource
                        ? props.paintOperations
                        : new ArrayDataSource(props.paintOperations)
                    : new ArrayDataSource([])
            }
        },
        onAttach: props.onAttach,
        onDetach: props.onDetach
    });
}

export const canvasDefaultModel: CanvasEntity = {
    width: new DataSource('auto'),
    height: new DataSource('auto')
};
