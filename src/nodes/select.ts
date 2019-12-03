import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';

export interface SelectProps extends AurumElementProps {
	onAttach?: Callback<Select>;
	onDetach?: Callback<Select>;
	onCreate?: Callback<Select>;
	onDispose?: Callback<Select>;
}

export class Select extends AurumElement {
	public readonly node: HTMLSelectElement;

	constructor(props: SelectProps) {
		super(props, 'select');
	}
}
