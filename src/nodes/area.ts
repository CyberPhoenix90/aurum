import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

export interface AreaProps extends AurumElementProps<HTMLAreaElement> {
	onAttach?: Callback<HTMLAreaElement>;
	onDetach?: Callback<HTMLAreaElement>;
	onCreate?: Callback<HTMLAreaElement>;
}

/**
 * @internal
 */
export class Area extends AurumElement {
	public readonly node: HTMLAreaElement;

	constructor(props: AreaProps, children: ChildNode[]) {
		super(props, children, 'area');
	}
}
