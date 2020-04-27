import { Callback, AttributeValue } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

export interface AudioProps extends AurumElementProps<HTMLAudioElement> {
	onAttach?: Callback<HTMLAudioElement>;
	onDetach?: Callback<HTMLAudioElement>;
	onCreate?: Callback<HTMLAudioElement>;
	controls?: AttributeValue;
	autoplay?: AttributeValue;
	loop?: AttributeValue;
	muted?: AttributeValue;
	preload?: AttributeValue;
	src?: AttributeValue;
}

/**
 * @internal
 */
export class Audio extends AurumElement {
	public readonly node: HTMLAudioElement;

	constructor(props: AudioProps, children: ChildNode[]) {
		super(props, children, 'audio');
		if (props !== null) {
			this.bindProps(['controls', 'autoplay', 'loop', 'muted', 'preload', 'src'], props);
		}
	}
}
