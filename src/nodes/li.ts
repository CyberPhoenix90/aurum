import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';

export interface LiProps extends AurumElementProps {
	onAttach?: Callback<Li>;
	onDetach?: Callback<Li>;
	onCreate?: Callback<Li>;
	onDispose?: Callback<Li>;
}

export class Li extends AurumElement {
	public node: HTMLLIElement;

	constructor(props: LiProps, children: ChildNode[]) {
		super(props, children, 'li');
	}
}
