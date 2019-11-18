import { AurumElement, AurumElementProps } from './aurum_element';

export interface PProps extends AurumElementProps {}

export class P extends AurumElement {
	constructor(props: PProps) {
		super(props, 'p');
	}
}
