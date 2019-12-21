import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface BrProps extends AurumElementProps {
	onAttach?: Callback<HTMLBRElement>;
	onDetach?: Callback<HTMLBRElement>;
	onCreate?: Callback<HTMLBRElement>;
}

/**
 * @internal
 */
export class Br extends AurumElement {
	public readonly node: HTMLBRElement;

	constructor(props: BrProps, children: ChildNode[]) {
		super(props, children, 'br');
	}
}
