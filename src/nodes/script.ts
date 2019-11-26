import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource } from '../utilities/common';

export interface ScriptProps extends AurumElementProps {
	onAttach?: (node: Script) => void;
	onDettach?: (node: Script) => void;
	src?: StringSource;
}

export class Script extends AurumElement {
	constructor(props: ScriptProps) {
		super(props, 'script');
		this.bindProps(['src'], props);
	}
}
