import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface ImgProps extends AurumElementProps {
	onAttach?: Callback<Img>;
	onDetach?: Callback<Img>;
	onCreate?: Callback<Img>;
	onDispose?: Callback<Img>;
	src?: StringSource;
	alt?: StringSource;
	width?: StringSource;
	height?: StringSource;
	referrerPolicy?: StringSource;
	sizes?: StringSource;
	srcset?: StringSource;
	useMap?: StringSource;
}

export class Img extends AurumElement {
	public readonly node: HTMLImageElement;

	constructor(props: ImgProps) {
		super(props, 'img');
		this.bindProps(['src', 'alt', 'width', 'height', 'referrerPolicy', 'sizes', 'srcset', 'useMap'], props);
	}
}
