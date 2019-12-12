import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface EmProps extends AurumElementProps {
	onAttach?: Callback<Em>;
	onDetach?: Callback<Em>;
	onCreate?: Callback<Em>;
	onDispose?: Callback<Em>;
}

export class Em extends AurumElement {
	constructor(props: EmProps, children: ChildNode[]) {
		super(props, children, 'em');
	}
}
