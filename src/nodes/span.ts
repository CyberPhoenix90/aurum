import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface SpanProps extends AurumElementProps {
	onAttach?: Callback<Span>;
	onDetach?: Callback<Span>;
	onCreate?: Callback<Span>;
	onDispose?: Callback<Span>;
}

export class Span extends AurumElement {
	public node: HTMLSpanElement;

	constructor(props: SpanProps) {
		super(props, 'span');
	}
}
