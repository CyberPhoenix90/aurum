import { AurumElement, AurumElementProps,ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';

export interface TheadProps extends AurumElementProps {
	onAttach?: Callback<Thead>;
	onDetach?: Callback<Thead>;
	onCreate?: Callback<Thead>;
	onDispose?: Callback<Thead>;
}

export class Thead extends AurumElement {
	constructor(props: TheadProps, children: ChildNode[]) {
		super(props, children, 'thead');
	}
}
