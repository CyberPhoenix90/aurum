import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface PreProps extends AurumElementProps {
	onAttach?: Callback<Pre>;
	onDetach?: Callback<Pre>;
	onCreate?: Callback<Pre>;
	onDispose?: Callback<Pre>;
}

export class Pre extends AurumElement {
	public node: HTMLPreElement;

	constructor(props: PreProps) {
		super(props, 'pre');
	}
}
