import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface IFrameProps extends AurumElementProps {
	onAttach?: Callback<HTMLIFrameElement>;
	onDetach?: Callback<HTMLIFrameElement>;
	onCreate?: Callback<HTMLIFrameElement>;
	src?: StringSource;
	allow?: StringSource;
	allowFullscreen?: StringSource;
	allowPaymentRequest?: StringSource;
	width?: StringSource;
	height?: StringSource;
	srcdoc?: StringSource;
}

/**
 * @internal
 */
export class IFrame extends AurumElement {
	public readonly node: HTMLIFrameElement;

	constructor(props: IFrameProps, children: ChildNode[]) {
		super(props, children, 'iframe');
		if (props !== null) {
			this.bindProps(['src', 'srcdoc', 'width', 'height', 'allow', 'allowFullscreen', 'allowPaymentRequest'], props);
		}
	}
}
