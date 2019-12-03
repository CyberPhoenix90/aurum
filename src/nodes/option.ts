import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';

export interface OptionProps extends AurumElementProps {
	onAttach?: Callback<Option>;
	onDetach?: Callback<Option>;
	onCreate?: Callback<Option>;
	onDispose?: Callback<Option>;
}

export class Option extends AurumElement {
	public readonly node: HTMLOptionElement;

	constructor(props: OptionProps) {
		super(props, 'option');
	}
}
