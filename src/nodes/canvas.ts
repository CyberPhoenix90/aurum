import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';

export interface CanvasProps extends AurumElementProps {
	onAttach?: Callback<HTMLCanvasElement>;
	onDetach?: Callback<HTMLCanvasElement>;
	onCreate?: Callback<HTMLCanvasElement>;
	width?: AttributeValue;
	height?: AttributeValue;
}

/**
 * @internal
 */
export class Canvas extends AurumElement {
	public readonly node: HTMLCanvasElement;

	constructor(props: CanvasProps, children: ChildNode[]) {
		super(props, children, 'canvas');
		if (props !== null) {
			this.bindProps(['width', 'height'], props);
		}
	}
}
