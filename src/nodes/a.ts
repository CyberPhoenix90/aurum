import { AurumElement, AurumElementProps } from './aurum_element';

export interface AProps extends AurumElementProps {
	onAttach?: (node: A) => void;
	onDettach?: (node: A) => void;
}

export class A extends AurumElement {
	constructor(props: AProps) {
		super(props, 'a');
	}
}
