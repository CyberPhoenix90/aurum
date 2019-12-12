import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
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

	constructor(props: LabelProps, children: ChildNode[]) {
		super(props, children, 'label');
		if (props !== null) {
			this.bindProps(['for'], props);
		}
	}
}
