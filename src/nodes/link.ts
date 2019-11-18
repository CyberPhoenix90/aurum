import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource } from '../utilities/common';

export interface LinkProps extends AurumElementProps {
	href?: StringSource;
	rel?: StringSource;
}

export class Link extends AurumElement {
	constructor(props: LinkProps) {
		super(props, 'link');
		this.bindProps(['href', 'rel'], props);
	}
}
