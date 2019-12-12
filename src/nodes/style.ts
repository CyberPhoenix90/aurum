import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, StringSource } from '../utilities/common';

export interface StyleProps extends AurumElementProps {
	onAttach?: Callback<Style>;
	onDetach?: Callback<Style>;
	onCreate?: Callback<Style>;
	onDispose?: Callback<Style>;
	media?: StringSource;
}

export class Style extends AurumElement {
	public node: HTMLStyleElement;

	constructor(props: StyleProps, children: ChildNode[]) {
		super(props, children, 'style');
		if (props !== null) {
			this.bindProps(['media'], props);
		}
	}
}
