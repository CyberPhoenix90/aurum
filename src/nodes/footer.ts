import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface FooterProps extends AurumElementProps {
	onAttach?: Callback<Footer>;
	onDettach?: Callback<Footer>;
}

export class Footer extends AurumElement {
	constructor(props: FooterProps) {
		super(props, 'header');
	}
}
