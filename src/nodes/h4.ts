import { AurumElement, AurumElementProps } from './aurum_element';

export interface H4Props extends AurumElementProps {
	onAttach?: (node: H4) => void;
	onDettach?: (node: H4) => void;
}

export class H4 extends AurumElement {
	constructor(props: H4Props) {
		super(props, 'h4');
	}
}
