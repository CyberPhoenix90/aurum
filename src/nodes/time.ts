import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback, StringSource } from '../utilities/common';

export interface TimeProps extends AurumElementProps {
	onAttach?: Callback<Time>;
	onDetach?: Callback<Time>;
	onCreate?: Callback<Time>;
	onDispose?: Callback<Time>;
	datetime?: StringSource;
}

export class Time extends AurumElement {
	public node: HTMLTimeElement;

	constructor(props: TimeProps, children: ChildNode[]) {
		super(props, children, 'time');
		if (props !== null) {
			this.bindProps(['datetime'], props);
		}
	}
}
