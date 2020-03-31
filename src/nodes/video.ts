import { Callback, AttributeValue } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

export interface VideoProps extends AurumElementProps {
	onAttach?: Callback<HTMLVideoElement>;
	onDetach?: Callback<HTMLVideoElement>;
	onCreate?: Callback<HTMLVideoElement>;
	controls?: AttributeValue;
	autoplay?: AttributeValue;
	loop?: AttributeValue;
	muted?: AttributeValue;
	preload?: AttributeValue;
	src?: AttributeValue;
	poster?: AttributeValue;
	width?: AttributeValue;
	height?: AttributeValue;
}

/**
 * @internal
 */
export class Video extends AurumElement {
	public readonly node: HTMLVideoElement;

	constructor(props: VideoProps, children: ChildNode[]) {
		super(props, children, 'video');
		if (props !== null) {
			this.bindProps(['controls', 'autoplay', 'loop', 'muted', 'preload', 'src', 'poster', 'width', 'height'], props);
		}
	}
}
