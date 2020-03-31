import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';

export interface StyleProps extends AurumElementProps {
	onAttach?: Callback<HTMLStyleElement>;
	onDetach?: Callback<HTMLStyleElement>;
	onCreate?: Callback<HTMLStyleElement>;
	media?: AttributeValue;
}

/**
 * @internal
 */
export class Style extends AurumElement {
	public node: HTMLStyleElement;

	constructor(props: StyleProps, children: ChildNode[]) {
		super(props, children, 'style');
		if (props !== null) {
			this.bindProps(['media'], props);
		}
	}
}
