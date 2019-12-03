import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface TableProps extends AurumElementProps {
	onAttach?: Callback<Table>;
	onDetach?: Callback<Table>;
	onCreate?: Callback<Table>;
	onDispose?: Callback<Table>;
}

export class Table extends AurumElement {
	public node: HTMLTableElement;

	constructor(props: TableProps) {
		super(props, 'table');
	}
}
