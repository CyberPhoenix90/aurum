import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface LabelProps extends AurumElementProps {
	onAttach?: Callback<Label>;
	onDetach?: Callback<Label>;
	onCreate?: Callback<Label>;
	onDispose?: Callback<Label>;
	for?: StringSource;
}

export class Label extends AurumElement {
	public node: HTMLLabelElement;

	constructor(props: LabelProps) {
		super(props, 'label');
		this.bindProps(['for'], props);
	}
}
