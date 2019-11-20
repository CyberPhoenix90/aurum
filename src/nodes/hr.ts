import { AurumElement, AurumElementProps } from './aurum_element';

export interface HrProps extends AurumElementProps {
	onAttach?: (node: Hr) => void;
}

export class Hr extends AurumElement {
	constructor(props: HrProps) {
		super(props, 'hr');
	}
}
