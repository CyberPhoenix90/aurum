import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';

export interface SupProps extends AurumElementProps {
	onAttach?: Callback<Sup>;
	onDetach?: Callback<Sup>;
	onCreate?: Callback<Sup>;
	onDispose?: Callback<Sup>;
}

export class Sup extends AurumElement {
	constructor(props: SupProps, children: ChildNode[]) {
		super(props, children, 'sup');
	}
}
