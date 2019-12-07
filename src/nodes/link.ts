import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface LinkProps extends AurumElementProps {
	onAttach?: Callback<Link>;
	onDetach?: Callback<Link>;
	onCreate?: Callback<Link>;
	onDispose?: Callback<Link>;
	href?: StringSource;
	rel?: StringSource;
	media?: StringSource;
	as?: StringSource;
	disabled?: StringSource;
	type?: StringSource;
}

export class Link extends AurumElement {
	public node: HTMLLinkElement;

	constructor(props: LinkProps) {
		super(props, 'link');
		if (props !== null) {
			this.bindProps(['href', 'rel', 'media', 'as', 'disabled', 'type'], props);
		}
	}
}
