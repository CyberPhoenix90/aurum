import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface ProgressProps extends AurumElementProps {
	onAttach?: Callback<Progress>;
	onDetach?: Callback<Progress>;
	onCreate?: Callback<Progress>;
	onDispose?: Callback<Progress>;

	max?: StringSource;
	value?: StringSource;
}

export class Progress extends AurumElement {
	public node: HTMLProgressElement;

	constructor(props: ProgressProps, children: ChildNode[]) {
		super(props, children, 'progress');
		if (props !== null) {
			this.bindProps(['max', 'value'], props);
		}
	}
}
