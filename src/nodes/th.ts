import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface ThProps extends AurumElementProps {
	onAttach?: Callback<Th>;
	onDetach?: Callback<Th>;
	onCreate?: Callback<Th>;
	onDispose?: Callback<Th>;
}

export class Th extends AurumElement {
	public node: HTMLTableHeaderCellElement;

	constructor(props: ThProps, children: ChildNode[]) {
		super(props, children, 'th');
	}
}
