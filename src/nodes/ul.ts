import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface UlProps extends AurumElementProps {
	onAttach?: Callback<HTMLUListElement>;
	onDetach?: Callback<HTMLUListElement>;
	onCreate?: Callback<HTMLUListElement>;
}

/**
 * @internal
 */
export class Ul extends AurumElement {
	public node: HTMLUListElement;

	constructor(props: UlProps, children: ChildNode[]) {
		super(props, children, 'ul');
	}
}
