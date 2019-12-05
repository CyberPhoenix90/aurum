import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface BodyProps extends AurumElementProps {
	onAttach?: Callback<Body>;
	onDetach?: Callback<Body>;
	onCreate?: Callback<Body>;
	onDispose?: Callback<Body>;
}

export class Body extends AurumElement {
	constructor(props: BodyProps) {
		super(props, 'body');
	}
}
