import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface OlProps extends AurumElementProps<HTMLOListElement> {
	onAttach?: Callback<HTMLOListElement>;
	onDetach?: Callback<HTMLOListElement>;
	onCreate?: Callback<HTMLOListElement>;
}

/**
 * @internal
 */
export class Ol extends AurumElement {
	public node: HTMLOListElement;

	constructor(props: OlProps, children: ChildNode[]) {
		super(props, children, 'ol');
	}
}
