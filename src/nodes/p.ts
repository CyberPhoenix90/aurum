import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface PProps extends AurumElementProps {
	onAttach?: Callback<HTMLParagraphElement>;
	onDetach?: Callback<HTMLParagraphElement>;
	onCreate?: Callback<HTMLParagraphElement>;
}

/**
 * @internal
 */
export class P extends AurumElement {
	public node: HTMLParagraphElement;

	constructor(props: PProps, children: ChildNode[]) {
		super(props, children, 'p');
	}
}
