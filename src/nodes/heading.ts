import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface HeadingProps extends AurumElementProps<HTMLHeadingElement> {
	onAttach?: Callback<HTMLHeadingElement>;
	onDetach?: Callback<HTMLHeadingElement>;
	onCreate?: Callback<HTMLHeadingElement>;
}

/**
 * @internal
 */
export class Heading extends AurumElement {
	public readonly node: HTMLHeadingElement;

	constructor(props: HeadingProps, children: ChildNode[]) {
		super(props, children, 'heading');
	}
}
