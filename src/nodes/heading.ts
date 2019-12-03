import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface HeadingProps extends AurumElementProps {
	onAttach?: Callback<Heading>;
	onDetach?: Callback<Heading>;
	onCreate?: Callback<Heading>;
	onDispose?: Callback<Heading>;
}

export class Heading extends AurumElement {
	public readonly node: HTMLHeadingElement;

	constructor(props: HeadingProps) {
		super(props, 'heading');
	}
}
