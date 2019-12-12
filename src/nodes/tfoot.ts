import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface TfootProps extends AurumElementProps {
	onAttach?: Callback<Tfoot>;
	onDetach?: Callback<Tfoot>;
	onCreate?: Callback<Tfoot>;
	onDispose?: Callback<Tfoot>;
}

export class Tfoot extends AurumElement {
	constructor(props: TfootProps, children: ChildNode[]) {
		super(props, children, 'tfoot');
	}
}
