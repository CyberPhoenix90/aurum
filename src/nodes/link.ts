import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface LinkProps extends AurumElementProps {
	onAttach?: Callback<HTMLLinkElement>;
	onDetach?: Callback<HTMLLinkElement>;
	onCreate?: Callback<HTMLLinkElement>;
	href?: StringSource;
	rel?: StringSource;
	media?: StringSource;
	as?: StringSource;
	disabled?: StringSource;
	type?: StringSource;
}

/**
 * @internal
 */
export class Link extends AurumElement {
	public node: HTMLLinkElement;

	constructor(props: LinkProps, children: ChildNode[]) {
		super(props, children, 'link');
		if (props !== null) {
			this.bindProps(['href', 'rel', 'media', 'as', 'disabled', 'type'], props);
		}
	}
}
