import { StringSource, Callback } from '../utilities/common';
import { AurumElement, ChildNode, AurumElementProps } from './aurum_element';

export interface AProps extends AurumElementProps {
	onAttach?: Callback<A>;
	onDetach?: Callback<A>;
	onCreate?: Callback<A>;
	onDispose?: Callback<A>;
	href?: StringSource;
	target?: StringSource;
}

export class A extends AurumElement {
	public readonly node: HTMLAnchorElement;

	constructor(props: AProps, children: ChildNode[]) {
		super(props, children, 'a');
		if (props !== null) {
			this.bindProps(['href', 'target'], props);
		}
	}
}
