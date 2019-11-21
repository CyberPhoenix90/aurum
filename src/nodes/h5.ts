import { AurumElement, AurumElementProps } from './aurum_element';

export interface H5Props extends AurumElementProps {
	onAttach?: (node: H5) => void;
	onDettach?: (node: H5) => void;
}

export class H5 extends AurumElement {
	constructor(props: H5Props) {
		super(props, 'h5');
	}
}
