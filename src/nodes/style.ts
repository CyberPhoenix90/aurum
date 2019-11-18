import { AurumElement, AurumElementProps } from './aurum_element';

export interface StyleProps extends AurumElementProps {}

export class Style extends AurumElement {
	constructor(props: StyleProps) {
		super(props, 'style');
	}
}
