import { AurumElement, AurumElementProps } from './aurum_element';

export interface AProps extends AurumElementProps {}

export class A extends AurumElement {
	constructor(props: AProps) {
		super(props, 'a');
	}
}
