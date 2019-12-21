import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface LabelProps extends AurumElementProps {
	onAttach?: Callback<HTMLLabelElement>;
	onDetach?: Callback<HTMLLabelElement>;
	onCreate?: Callback<HTMLLabelElement>;
	for?: StringSource;
}

/**
 * @internal
 */
export class Label extends AurumElement {
	public node: HTMLLabelElement;

	constructor(props: LabelProps, children: ChildNode[]) {
		super(props, children, 'label');
		if (props !== null) {
			this.bindProps(['for'], props);
		}
	}
}
