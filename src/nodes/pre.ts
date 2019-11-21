import { AurumElement, AurumElementProps } from './aurum_element';

export interface PreProps extends AurumElementProps {
	onAttach?: (node: Pre) => void;
}

export class Pre extends AurumElement {
	constructor(props: PreProps) {
		super(props, 'pre');
	}
}
