import { AurumElement, AurumElementProps } from './aurum_element';

export interface ThProps extends AurumElementProps {}

export class Th extends AurumElement {
	constructor(props: ThProps) {
		super(props, 'th');
	}
}
