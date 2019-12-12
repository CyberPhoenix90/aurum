import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

export interface AreaProps extends AurumElementProps {
	onAttach?: Callback<Area>;
	onDetach?: Callback<Area>;
	onCreate?: Callback<Area>;
	onDispose?: Callback<Area>;
}

export class Area extends AurumElement {
	public readonly node: HTMLAreaElement;

	constructor(props: AreaProps, children: ChildNode[]) {
		super(props, children, 'area');
	}
}
