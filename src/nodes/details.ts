import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';

export interface DetailsProps extends AurumElementProps {
	onAttach?: Callback<Details>;
	onDetach?: Callback<Details>;
	onCreate?: Callback<Details>;
	onDispose?: Callback<Details>;
}

export class Details extends AurumElement {
	public readonly node: HTMLDetailsElement;

	constructor(props: DetailsProps, children: ChildNode[]) {
		super(props, children, 'details');
	}
}
