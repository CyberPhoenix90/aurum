import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';

export interface LinkProps extends AurumElementProps<HTMLLinkElement> {
	onAttach?: Callback<HTMLLinkElement>;
	onDetach?: Callback<HTMLLinkElement>;
	onCreate?: Callback<HTMLLinkElement>;
	href?: AttributeValue;
	rel?: AttributeValue;
	media?: AttributeValue;
	as?: AttributeValue;
	disabled?: AttributeValue;
	type?: AttributeValue;
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
