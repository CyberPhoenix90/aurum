import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface IFrameProps extends AurumElementProps {
	onAttach?: Callback<IFrame>;
	onDetach?: Callback<IFrame>;
	onCreate?: Callback<IFrame>;
	onDispose?: Callback<IFrame>;
	src?: StringSource;
	allow?: StringSource;
	allowFullscreen?: StringSource;
	allowPaymentRequest?: StringSource;
	width?: StringSource;
	height?: StringSource;
	srcdoc?: StringSource;
}

export class IFrame extends AurumElement {
	public readonly node: HTMLIFrameElement;

	constructor(props: IFrameProps, children: ChildNode[]) {
		super(props, children, 'iframe');
		if (props !== null) {
			this.bindProps(['src', 'srcdoc', 'width', 'height', 'allow', 'allowFullscreen', 'allowPaymentRequest'], props);
		}
	}
}
