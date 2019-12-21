import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface DataProps extends AurumElementProps {
	onAttach?: Callback<HTMLDataElement>;
	onDetach?: Callback<HTMLDataElement>;
	onCreate?: Callback<HTMLDataElement>;
	value?: StringSource;
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
