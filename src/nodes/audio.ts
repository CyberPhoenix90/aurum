import { Callback, StringSource } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

export interface AudioProps extends AurumElementProps {
	onAttach?: Callback<HTMLAudioElement>;
	onDetach?: Callback<HTMLAudioElement>;
	onCreate?: Callback<HTMLAudioElement>;
	controls?: StringSource;
	autoplay?: StringSource;
	loop?: StringSource;
	muted?: StringSource;
	preload?: StringSource;
	src?: StringSource;
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
