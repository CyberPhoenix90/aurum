import { Callback, StringSource } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

export interface VideoProps extends AurumElementProps {
	onAttach?: Callback<Video>;
	onDetach?: Callback<Video>;
	onCreate?: Callback<Video>;
	onDispose?: Callback<Video>;
	controls?: StringSource;
	autoplay?: StringSource;
	loop?: StringSource;
	muted?: StringSource;
	preload?: StringSource;
	src?: StringSource;
	poster?: StringSource;
	width?: StringSource;
	height?: StringSource;
}

export class Video extends AurumElement {
	public readonly node: HTMLVideoElement;

	constructor(props: VideoProps, children: ChildNode[]) {
		super(props, children, 'video');
		if (props !== null) {
			this.bindProps(['controls', 'autoplay', 'loop', 'muted', 'preload', 'src', 'poster', 'width', 'height'], props);
		}
	}
}
