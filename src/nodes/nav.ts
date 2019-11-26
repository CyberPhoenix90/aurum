import { AurumElement, AurumElementProps } from './aurum_element';

export interface NavProps extends AurumElementProps {
	onAttach?: (node: Nav) => void;
	onDettach?: (node: Nav) => void;
}

export class Nav extends AurumElement {
	constructor(props: NavProps) {
		super(props, 'nav');
	}
}
