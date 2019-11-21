import { AurumElement, AurumElementProps } from './aurum_element';

export interface OlProps extends AurumElementProps {
	onAttach?: (node: Ol) => void;
	onDettach?: (node: Ol) => void;
}

export class Ol extends AurumElement {
	constructor(props: OlProps) {
		super(props, 'ol');
	}
}
