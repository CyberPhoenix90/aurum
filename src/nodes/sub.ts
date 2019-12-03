import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface SubProps extends AurumElementProps {
	onAttach?: Callback<Sub>;
	onDetach?: Callback<Sub>;
	onCreate?: Callback<Sub>;
	onDispose?: Callback<Sub>;
}

export class Sub extends AurumElement {
	constructor(props: SubProps) {
		super(props, 'sub');
	}
}