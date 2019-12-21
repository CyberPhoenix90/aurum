import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface DivProps extends AurumElementProps {
	onAttach?: Callback<HTMLDivElement>;
	onDetach?: Callback<HTMLDivElement>;
	onCreate?: Callback<HTMLDivElement>;
}

/**
 * @internal
 */
export class Div extends AurumElement {
	public readonly node: HTMLDivElement;

	constructor(props: DivProps, children: ChildNode[]) {
		super(props, children, 'div');
	}
}
