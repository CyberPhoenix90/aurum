import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface HeaderProps extends AurumElementProps {
	onAttach?: Callback<Header>;
	onDettach?: Callback<Header>;
}

export class Header extends AurumElement {
	constructor(props: HeaderProps) {
		super(props, 'header');
	}
}
