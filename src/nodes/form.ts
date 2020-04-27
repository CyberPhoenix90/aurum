import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface FormProps extends AurumElementProps<HTMLFormElement> {
	onAttach?: Callback<HTMLFormElement>;
	onDetach?: Callback<HTMLFormElement>;
	onCreate?: Callback<HTMLFormElement>;
}

/**
 * @internal
 */
export class Form extends AurumElement {
	public readonly node: HTMLFormElement;

	constructor(props: FormProps, children: ChildNode[]) {
		super(props, children, 'form');
	}
}
