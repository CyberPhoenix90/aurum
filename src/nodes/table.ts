import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface TableProps extends AurumElementProps<HTMLTableElement> {
	onAttach?: Callback<HTMLTableElement>;
	onDetach?: Callback<HTMLTableElement>;
	onCreate?: Callback<HTMLTableElement>;
}

/**
 * @internal
 */
export class Table extends AurumElement {
	public node: HTMLTableElement;

	constructor(props: TableProps, children: ChildNode[]) {
		super(props, children, 'table');
	}
}
