import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface HeaderProps extends AurumElementProps {
	onAttach?: Callback<Header>;
	onDetach?: Callback<Header>;
	onCreate?: Callback<Header>;
	onDispose?: Callback<Header>;
}

export class Header extends AurumElement {
	constructor(props: HeaderProps, children: ChildNode[]) {
		super(props, children, 'header');
	}
}
