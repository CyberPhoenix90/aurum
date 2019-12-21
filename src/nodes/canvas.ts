import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface CanvasProps extends AurumElementProps {
	onAttach?: Callback<HTMLCanvasElement>;
	onDetach?: Callback<HTMLCanvasElement>;
	onCreate?: Callback<HTMLCanvasElement>;
	width?: StringSource;
	height?: StringSource;
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
