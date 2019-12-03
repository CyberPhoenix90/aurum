import { Callback, StringSource } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';

export interface AudioProps extends AurumElementProps {
	onAttach?: Callback<Audio>;
	onDetach?: Callback<Audio>;
	onCreate?: Callback<Audio>;
	onDispose?: Callback<Audio>;
	controls?: StringSource;
	autoplay?: StringSource;
	loop?: StringSource;
	muted?: StringSource;
	preload?: StringSource;
	src?: StringSource;
}

export class Audio extends AurumElement {
	public readonly node: HTMLAudioElement;

	constructor(props: AudioProps) {
		super(props, 'audio');
		this.bindProps(['controls', 'autoplay', 'loop', 'muted', 'preload', 'src'], props);
	}
}
