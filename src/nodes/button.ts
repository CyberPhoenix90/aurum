import { AurumElement, AurumElementProps } from './aurum_element';

export interface ButtonProps extends AurumElementProps {
	onAttach?: (node: Button) => void;
	onDettach?: (node: Button) => void;
}

export class Button extends AurumElement {
	constructor(props: ButtonProps) {
		super(props, 'button');
	}
}
