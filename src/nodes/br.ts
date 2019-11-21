import { AurumElement, AurumElementProps } from './aurum_element';

export interface BrProps extends AurumElementProps {
	onAttach?: (node: Br) => void;
	onDettach?: (node: Br) => void;
}

export class Br extends AurumElement {
	constructor(props: BrProps) {
		super(props, 'br');
	}
}
