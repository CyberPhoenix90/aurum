import { AurumElement, AurumElementProps } from './aurum_element';

export interface DivProps extends AurumElementProps {
	onAttach?: (node: Div) => void;
	onDettach?: (node: Div) => void;
}

export class Div extends AurumElement {
	constructor(props: DivProps) {
		super(props, 'div');
	}
}
