import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface SummaryProps extends AurumElementProps {
	onAttach?: Callback<Summary>;
	onDetach?: Callback<Summary>;
	onCreate?: Callback<Summary>;
	onDispose?: Callback<Summary>;
}

export class Summary extends AurumElement {
	constructor(props: SummaryProps) {
		super(props, 'summary');
	}
}
