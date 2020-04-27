import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';

export interface DataProps extends AurumElementProps<HTMLDataElement> {
	onAttach?: Callback<HTMLDataElement>;
	onDetach?: Callback<HTMLDataElement>;
	onCreate?: Callback<HTMLDataElement>;
	value?: AttributeValue;
}

/**
 * @internal
 */
export class Data extends AurumElement {
	public node: HTMLDataElement;

	constructor(props: DataProps, children: ChildNode[]) {
		super(props, children, 'data');
		if (props !== null) {
			this.bindProps(['datalue'], props);
		}
	}
}
