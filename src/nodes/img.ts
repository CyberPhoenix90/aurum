import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource } from '../utilities/common';

export interface ImgProps extends AurumElementProps {
	src?: StringSource;
}

export class Img extends AurumElement {
	constructor(props: ImgProps) {
		super(props, 'img');
		this.bindProps(['src'], props);
	}
}
