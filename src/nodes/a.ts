import { Callback, AttributeValue } from '../utilities/common';
import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';

export interface AProps extends AurumElementProps<HTMLAnchorElement> {
	onAttach?: Callback<HTMLAnchorElement>;
	onDetach?: Callback<HTMLAnchorElement>;
	onCreate?: Callback<HTMLAnchorElement>;
	href?: AttributeValue;
	target?: AttributeValue;
}

/**
 * @internal
 */
export class A extends AurumElement {
	public readonly node: HTMLAnchorElement;

	constructor(props: AProps, children: ChildNode[]) {
		super(props, children, 'a');
		if (props !== null) {
			this.bindProps(['href', 'target'], props);
		}
	}
}
