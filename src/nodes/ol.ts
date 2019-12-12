import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface OlProps extends AurumElementProps {
	onAttach?: Callback<Ol>;
	onDetach?: Callback<Ol>;
	onCreate?: Callback<Ol>;
	onDispose?: Callback<Ol>;
}

export class Ol extends AurumElement {
	public node: HTMLOListElement;

	constructor(props: OlProps, children: ChildNode[]) {
		super(props, children, 'ol');
	}
}
