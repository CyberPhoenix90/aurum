import { ArrayDataSource, AurumComponentAPI, DataSource } from 'aurumjs';
import { CommonEntityProps } from '../../../models/entities';
import { CanvasGraphNode } from './api';
import { AbstractShape } from '../../../math/shapes/abstract_shape';
import { Data } from '../../../models/input_data';
import { normalizeComponents, propsToModel } from '../../shared';
import { entityDefaults } from '../../entity_defaults';
import { CanvasEntity } from './model';
import { AbstractReactiveShape } from '../../../math/reactive_shapes/abstract_reactive_shape';

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
