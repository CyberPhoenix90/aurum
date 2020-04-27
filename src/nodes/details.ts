import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface DetailsProps extends AurumElementProps<HTMLDetailsElement> {
	onAttach?: Callback<HTMLDetailsElement>;
	onDetach?: Callback<HTMLDetailsElement>;
	onCreate?: Callback<HTMLDetailsElement>;
}

/**
 * @internal
 */
export class Details extends AurumElement {
	public readonly node: HTMLDetailsElement;

	constructor(props: DetailsProps, children: ChildNode[]) {
		super(props, children, 'details');
	}
}
