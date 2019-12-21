import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface TrProps extends AurumElementProps {
	onAttach?: Callback<HTMLTableRowElement>;
	onDetach?: Callback<HTMLTableRowElement>;
	onCreate?: Callback<HTMLTableRowElement>;
}

/**
 * @internal
 */
export class Tr extends AurumElement {
	public node: HTMLTableRowElement;

	constructor(props: TrProps, children: ChildNode[]) {
		super(props, children, 'tr');
	}
}
