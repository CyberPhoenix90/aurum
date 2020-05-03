import { Rendered, Renderable, AurumElement, aurumElementModelIdentitiy, AurumElementModel } from './aurum_element';
import { DataSource, ArrayDataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';

export function render<T extends Renderable>(element: T): T extends Array<any> ? Rendered[] : Rendered {
	if (element == undefined) {
		return undefined;
	}

	if (Array.isArray(element)) {
		// Flatten the rendered content into a single array to avoid having to iterate over nested arrays later
		return Array.prototype.concat.apply([], element.map(render));
	}

	if (element instanceof DataSource || element instanceof DuplexDataSource) {
		const result = new AurumElement();
		element.listenAndRepeat((value) => {
			if (Array.isArray(value)) {
				result.updateChildren(render(value));
			} else {
				result.updateChildren([render(value) as any]);
			}
		});

		return result as any;
	}

	if (element instanceof ArrayDataSource) {
		const result = new AurumElement();
		element.listenAndRepeat((change) => {});

		return result as any;
	}

	const type = typeof element;
	if (type === 'string' || type === 'number' || type === 'bigint') {
		return document.createTextNode(element.toString()) as any;
	}

	if (element[aurumElementModelIdentitiy]) {
		const model: AurumElementModel<any> = (element as any) as AurumElementModel<any>;
		return render(
			model.factory(model.props, model.children, {
				onAttach: () => {
					throw new Error('not implemented');
				},
				onDetach: () => {
					throw new Error('not implemented');
				},
				onError: () => {
					throw new Error('not implemented');
				}
			})
		) as any;
	}
	// Unsupported types are returned as is in hope that a transclusion component will transform it into something compatible
	return element as any;
}
