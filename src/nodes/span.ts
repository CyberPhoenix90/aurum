import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface SpanProps extends AurumElementProps<HTMLSpanElement> {
	onAttach?: Callback<HTMLSpanElement>;
	onDetach?: Callback<HTMLSpanElement>;
	onCreate?: Callback<HTMLSpanElement>;
}

/**
 * @internal
 */
export class Span extends AurumElement {
	public node: HTMLSpanElement;

	constructor(props: SpanProps, children: ChildNode[]) {
		super(props, children, 'span');
	}
}
