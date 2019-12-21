import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface BodyProps extends AurumElementProps {
	onAttach?: Callback<HTMLBodyElement>;
	onDetach?: Callback<HTMLBodyElement>;
	onCreate?: Callback<HTMLBodyElement>;
}

/**
 * @internal
 */
export class Body extends AurumElement {
	public readonly node: HTMLBodyElement;

	constructor(props: BodyProps, children: ChildNode[]) {
		super(props, children, 'body');
	}
}
