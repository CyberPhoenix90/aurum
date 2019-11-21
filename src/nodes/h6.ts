import { AurumElement, AurumElementProps } from './aurum_element';

export interface H6Props extends AurumElementProps {
	onAttach?: (node: H6) => void;
	onDettach?: (node: H6) => void;
}

export class H6 extends AurumElement {
	constructor(props: H6Props) {
		super(props, 'h6');
	}
}
