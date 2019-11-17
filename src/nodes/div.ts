import { AurumElement, AurumElementProps } from './aurum_element';

export interface DivProps extends AurumElementProps {}

export class Div extends AurumElement {
	constructor(props: DivProps) {
		super(props);
	}

	public create(props: DivProps): HTMLElement {
		const div = document.createElement('div');
		return div;
	}
}
