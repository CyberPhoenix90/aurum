import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface ImgProps extends AurumElementProps {
	onAttach?: Callback<HTMLImageElement>;
	onDetach?: Callback<HTMLImageElement>;
	onCreate?: Callback<HTMLImageElement>;
	src?: StringSource;
	alt?: StringSource;
	width?: StringSource;
	height?: StringSource;
	referrerPolicy?: StringSource;
	sizes?: StringSource;
	srcset?: StringSource;
	useMap?: StringSource;
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
