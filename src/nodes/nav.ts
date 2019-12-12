import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface NavProps extends AurumElementProps {
	onAttach?: Callback<Nav>;
	onDetach?: Callback<Nav>;
	onCreate?: Callback<Nav>;
	onDispose?: Callback<Nav>;
}

export class Nav extends AurumElement {
	constructor(props: NavProps, children: ChildNode[]) {
		super(props, children, 'nav');
	}
}
