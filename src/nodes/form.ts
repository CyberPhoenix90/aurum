import { AurumElement, AurumElementProps } from './aurum_element';

export interface FormProps extends AurumElementProps {
	onAttach?: (node: Form) => void;
	onDettach?: (node: Form) => void;
}

export class Form extends AurumElement {
	constructor(props: FormProps) {
		super(props, 'form');
	}
}
