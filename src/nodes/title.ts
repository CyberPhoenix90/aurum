import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';

export interface TitleProps extends AurumElementProps {
	onAttach?: Callback<Title>;
	onDetach?: Callback<Title>;
	onCreate?: Callback<Title>;
	onDispose?: Callback<Title>;
}

export class Title extends AurumElement {
	public node: HTMLTitleElement;

	constructor(props: TitleProps, children: ChildNode[]) {
		super(props, children, 'title');
	}
}
