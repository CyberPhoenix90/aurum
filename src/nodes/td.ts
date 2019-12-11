import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';

export interface TdProps extends AurumElementProps {
	onAttach?: Callback<Td>;
	onDetach?: Callback<Td>;
	onCreate?: Callback<Td>;
	onDispose?: Callback<Td>;
}

export class Td extends AurumElement {
	public node: HTMLTableColElement;

	constructor(props: TdProps, children: ChildNode[]) {
		super(props, children, 'td');
	}
}
