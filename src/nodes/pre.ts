import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface PreProps extends AurumElementProps {
	onAttach?: Callback<HTMLPreElement>;
	onDetach?: Callback<HTMLPreElement>;
	onCreate?: Callback<HTMLPreElement>;
}

/**
 * @internal
 */
export class Pre extends AurumElement {
	public node: HTMLPreElement;

	constructor(props: PreProps, children: ChildNode[]) {
		super(props, children, 'pre');
	}
}
