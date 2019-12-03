import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface FormProps extends AurumElementProps {
	onAttach?: Callback<Form>;
	onDetach?: Callback<Form>;
	onCreate?: Callback<Form>;
	onDispose?: Callback<Form>;
}

export class Form extends AurumElement {
	public readonly node: HTMLFormElement;

	constructor(props: FormProps) {
		super(props, 'form');
	}
}
