import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, StringSource } from '../utilities/common';

export interface TimeProps extends AurumElementProps {
	onAttach?: Callback<HTMLTimeElement>;
	onDetach?: Callback<HTMLTimeElement>;
	onCreate?: Callback<HTMLTimeElement>;
	datetime?: StringSource;
}

/**
 * @internal
 */
export class Time extends AurumElement {
	public node: HTMLTimeElement;

	constructor(props: TimeProps, children: ChildNode[]) {
		super(props, children, 'time');
		if (props !== null) {
			this.bindProps(['datetime'], props);
		}
	}
}
