import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface ThProps extends AurumElementProps {
	onAttach?: Callback<HTMLTableHeaderCellElement>;
	onDetach?: Callback<HTMLTableHeaderCellElement>;
	onCreate?: Callback<HTMLTableHeaderCellElement>;
}

/**
 * @internal
 */
export class Th extends AurumElement {
	public node: HTMLTableHeaderCellElement;

	constructor(props: ThProps, children: ChildNode[]) {
		super(props, children, 'th');
	}
}
