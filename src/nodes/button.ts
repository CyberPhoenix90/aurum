import { AurumElement, AurumElementProps } from './aurum_element';

export interface ButtonProps extends AurumElementProps {}

export class Button extends AurumElement {
	constructor(props: ButtonProps) {
		super(props, 'button');
	}
}
