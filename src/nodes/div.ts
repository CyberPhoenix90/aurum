import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface DivProps extends AurumElementProps {
	onAttach?: Callback<Div>;
	onDetach?: Callback<Div>;
	onCreate?: Callback<Div>;
	onDispose?: Callback<Div>;
}

export class Div extends AurumElement {
	public readonly node: HTMLDivElement;

	constructor(props: DivProps) {
		super(props, 'div');
	}
}
