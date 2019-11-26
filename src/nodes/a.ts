import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource } from '../utilities/common';

export interface AProps extends AurumElementProps {
	onAttach?: (node: A) => void;
	onDettach?: (node: A) => void;
	href?: StringSource;
}

export class A extends AurumElement {
	constructor(props: AProps) {
		super(props, 'a');
		this.bindProps(['href'], props);
	}
}
