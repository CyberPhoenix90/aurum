import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface QProps extends AurumElementProps<HTMLQuoteElement> {
	onAttach?: Callback<HTMLQuoteElement>;
	onDetach?: Callback<HTMLQuoteElement>;
	onCreate?: Callback<HTMLQuoteElement>;
}

/**
 * @internal
 */
export class Q extends AurumElement {
	public node: HTMLQuoteElement;

	constructor(props: QProps, children: ChildNode[]) {
		super(props, children, 'q');
	}
}
