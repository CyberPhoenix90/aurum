import { Callback, StringSource } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

export interface SourceProps extends AurumElementProps {
	onAttach?: Callback<HTMLSourceElement>;
	onDetach?: Callback<HTMLSourceElement>;
	onCreate?: Callback<HTMLSourceElement>;
	src?: StringSource;
	srcSet?: StringSource;
	media?: StringSource;
	sizes?: StringSource;
	type?: StringSource;
}

/**
 * @internal
 */
export class Source extends AurumElement {
	public readonly node: HTMLSourceElement;

	constructor(props: SourceProps, children: ChildNode[]) {
		super(props, children, 'source');
		if (props !== null) {
			this.bindProps(['src', 'srcSet', 'media', 'sizes', 'type'], props);
		}
	}
}
