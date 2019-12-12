import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface ButtonProps extends AurumElementProps {
	disabled?: StringSource;
	onAttach?: Callback<Button>;
	onDetach?: Callback<Button>;
	onCreate?: Callback<Button>;
	onDispose?: Callback<Button>;
}

export class Button extends AurumElement {
	public readonly node: HTMLButtonElement;

	constructor(props: ButtonProps, children: ChildNode[]) {
		super(props, children, 'button');
		if (props !== null) {
			this.bindProps(['disabled'], props);
		}
	}
}
