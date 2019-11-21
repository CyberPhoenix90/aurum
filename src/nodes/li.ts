import { AurumElement, AurumElementProps } from './aurum_element';

export interface LiProps extends AurumElementProps {
	onAttach?: (node: Li) => void;
	onDettach?: (node: Li) => void;
}

export class Li extends AurumElement {
	constructor(props: LiProps) {
		super(props, 'li');
	}
}
