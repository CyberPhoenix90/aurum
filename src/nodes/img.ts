import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';

export interface ImgProps extends AurumElementProps<HTMLImageElement> {
	onAttach?: Callback<HTMLImageElement>;
	onDetach?: Callback<HTMLImageElement>;
	onCreate?: Callback<HTMLImageElement>;
	src?: AttributeValue;
	alt?: AttributeValue;
	width?: AttributeValue;
	height?: AttributeValue;
	referrerPolicy?: AttributeValue;
	sizes?: AttributeValue;
	srcset?: AttributeValue;
	useMap?: AttributeValue;
}

/**
 * @internal
 */
export class Img extends AurumElement {
	public readonly node: HTMLImageElement;

	constructor(props: ImgProps, children: ChildNode[]) {
		super(props, children, 'img');
		if (props !== null) {
			this.bindProps(['src', 'alt', 'width', 'height', 'referrerPolicy', 'sizes', 'srcset', 'useMap'], props);
		}
	}
}
