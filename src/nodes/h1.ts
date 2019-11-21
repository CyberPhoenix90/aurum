import { AurumElement, AurumElementProps } from './aurum_element';

export interface H1Props extends AurumElementProps {
	onAttach?: (node: H1) => void;
	onDettach?: (node: H1) => void;
}

export class H1 extends AurumElement {
	constructor(props: H1Props) {
		super(props, 'h1');
	}
}
