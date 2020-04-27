import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface TdProps extends AurumElementProps<HTMLTableColElement> {
	onAttach?: Callback<HTMLTableColElement>;
	onDetach?: Callback<HTMLTableColElement>;
	onCreate?: Callback<HTMLTableColElement>;
}

/**
 * @internal
 */
export class Td extends AurumElement {
	public node: HTMLTableColElement;

	constructor(props: TdProps, children: ChildNode[]) {
		super(props, children, 'td');
	}
}
