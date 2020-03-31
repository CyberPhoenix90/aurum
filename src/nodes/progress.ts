import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';

export interface ProgressProps extends AurumElementProps {
	onAttach?: Callback<HTMLProgressElement>;
	onDetach?: Callback<HTMLProgressElement>;
	onCreate?: Callback<HTMLProgressElement>;

	max?: AttributeValue;
	value?: AttributeValue;
}

/**
 * @internal
 */
export class Progress extends AurumElement {
	public node: HTMLProgressElement;

	constructor(props: ProgressProps, children: ChildNode[]) {
		super(props, children, 'progress');
		if (props !== null) {
			this.bindProps(['max', 'value'], props);
		}
	}
}
