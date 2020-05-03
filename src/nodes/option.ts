import { Callback, AttributeValue } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

export interface OptionProps extends AurumElementProps<HTMLOptionElement> {
	value?: AttributeValue;
	onAttach?: Callback<HTMLOptionElement>;
	onDetach?: Callback<HTMLOptionElement>;
	onCreate?: Callback<HTMLOptionElement>;
}

/**
 * @internal
 */
export class Option extends AurumElement {
	public readonly node: HTMLOptionElement;

	constructor(props: OptionProps, children: ChildNode[]) {
		super(props, children, 'option');
		if (props) {
			this.bindProps(['value'], props);
		}
	}
}
