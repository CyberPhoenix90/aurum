import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';

export interface ButtonProps extends AurumElementProps<HTMLButtonElement> {
	disabled?: AttributeValue;
	onAttach?: Callback<HTMLButtonElement>;
	onDetach?: Callback<HTMLButtonElement>;
	onCreate?: Callback<HTMLButtonElement>;
}

/**
 * @internal
 */
export class Button extends AurumElement {
	public readonly node: HTMLButtonElement;

	constructor(props: ButtonProps, children: ChildNode[]) {
		super(props, children, 'button');
		if (props !== null) {
			this.bindProps(['disabled'], props);
		}
	}
}
