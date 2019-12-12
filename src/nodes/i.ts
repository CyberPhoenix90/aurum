import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface IProps extends AurumElementProps {
	onAttach?: Callback<I>;
	onDetach?: Callback<I>;
	onCreate?: Callback<I>;
	onDispose?: Callback<I>;
}

export class I extends AurumElement {
	constructor(props: IProps, children: ChildNode[]) {
		super(props, children, 'i');
	}
}
