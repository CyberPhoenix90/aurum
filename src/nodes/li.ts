import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface LiProps extends AurumElementProps<HTMLLIElement> {
	onAttach?: Callback<HTMLLIElement>;
	onDetach?: Callback<HTMLLIElement>;
	onCreate?: Callback<HTMLLIElement>;
}

/**
 * @internal
 */
export class Li extends AurumElement {
	public node: HTMLLIElement;

	constructor(props: LiProps, children: ChildNode[]) {
		super(props, children, 'li');
	}
}
