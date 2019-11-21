import { AurumElement, AurumElementProps } from './aurum_element';

export interface H2Props extends AurumElementProps {
	onAttach?: (node: H2) => void;
	onDettach?: (node: H2) => void;
}

export class H2 extends AurumElement {
	constructor(props: H2Props) {
		super(props, 'h2');
	}
}
