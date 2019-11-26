import { AurumElement, AurumElementProps } from './aurum_element';

export interface IProps extends AurumElementProps {
	onAttach?: (node: I) => void;
	onDettach?: (node: I) => void;
}

export class I extends AurumElement {
	constructor(props: IProps) {
		super(props, 'i');
	}
}
