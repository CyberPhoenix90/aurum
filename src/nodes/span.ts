import { AurumElement, AurumElementProps } from './aurum_element';

export interface SpanProps extends AurumElementProps {}

export class Span extends AurumElement {
	constructor(props: SpanProps) {
		super(props, 'span');
	}
}
