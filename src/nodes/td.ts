import { AurumElement, AurumElementProps } from './aurum_element';

export interface TdProps extends AurumElementProps {}

export class Td extends AurumElement {
	constructor(props: TdProps) {
		super(props, 'td');
	}
}
