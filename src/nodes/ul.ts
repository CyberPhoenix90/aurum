import { AurumElement, AurumElementProps } from './aurum_element';
import { ArrayDataSource } from '../stream/array_data_source';

export interface UlProps extends AurumElementProps {
	onAttach?: (node: Ul) => void;
}

export class Ul extends AurumElement {
	constructor(props: UlProps) {
		super(props, 'ul');
	}
}
