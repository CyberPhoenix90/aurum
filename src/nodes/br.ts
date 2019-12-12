import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface BrProps extends AurumElementProps {
	onAttach?: Callback<Br>;
	onDetach?: Callback<Br>;
	onCreate?: Callback<Br>;
	onDispose?: Callback<Br>;
}

export class Br extends AurumElement {
	public readonly node: HTMLBRElement;

	constructor(props: BrProps, children: ChildNode[]) {
		super(props, children, 'br');
	}
}
