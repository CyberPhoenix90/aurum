import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface BProps extends AurumElementProps {
	onAttach?: Callback<B>;
	onDetach?: Callback<B>;
	onCreate?: Callback<B>;
	onDispose?: Callback<B>;
}

export class B extends AurumElement {
	constructor(props: BProps) {
		super(props, 'b');
	}
}
