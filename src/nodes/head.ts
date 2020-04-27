import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface HeadProps extends AurumElementProps<HTMLHeadElement> {
	onAttach?: Callback<HTMLHeadElement>;
	onDetach?: Callback<HTMLHeadElement>;
	onCreate?: Callback<HTMLHeadElement>;
}

/**
 * @internal
 */
export class Head extends AurumElement {
	public readonly node: HTMLHeadElement;

	constructor(props: HeadProps, children: ChildNode[]) {
		super(props, children, 'head');
	}
}
