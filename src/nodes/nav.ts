import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface NavProps extends AurumElementProps {
	onAttach?: Callback<Nav>;
	onDetach?: Callback<Nav>;
	onCreate?: Callback<Nav>;
	onDispose?: Callback<Nav>;
}

export class Nav extends AurumElement {
	constructor(props: NavProps) {
		super(props, 'nav');
	}
}
