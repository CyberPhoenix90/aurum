import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface TitleProps extends AurumElementProps {
	onAttach?: Callback<HTMLTitleElement>;
	onDetach?: Callback<HTMLTitleElement>;
	onCreate?: Callback<HTMLTitleElement>;
}

/**
 * @internal
 */
export class Title extends AurumElement {
	public node: HTMLTitleElement;

	constructor(props: TitleProps, children: ChildNode[]) {
		super(props, children, 'title');
	}
}
