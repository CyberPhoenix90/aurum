import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource } from '../utilities/common';

export interface ProgressProps extends AurumElementProps {
	onAttach?: (node: Progress) => void;
	max?: StringSource;
	value?: StringSource;
}

export class Progress extends AurumElement {
	constructor(props: ProgressProps) {
		super(props, 'progress');
		this.bindProps(['max', 'value'], props);
	}
}
