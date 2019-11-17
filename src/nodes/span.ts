import { AurumElement, AurumElementProps } from './aurum_element';

export interface SpanProps extends AurumElementProps {}

export class Span extends AurumElement {
	constructor(props: SpanProps) {
		super(props);
	}

	public create(props: SpanProps): HTMLElement {
		const span = document.createElement('span');
		return span;
	}
}
