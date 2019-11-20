import { AurumElement, AurumElementProps } from './aurum_element';

export interface TableProps extends AurumElementProps {}

export class Table extends AurumElement {
	constructor(props: TableProps) {
		super(props, 'table');
	}
}
