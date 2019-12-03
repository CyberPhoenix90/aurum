import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';

export interface TrProps extends AurumElementProps {
	onAttach?: Callback<Tr>;
	onDetach?: Callback<Tr>;
	onCreate?: Callback<Tr>;
	onDispose?: Callback<Tr>;
}

export class Tr extends AurumElement {
	public node: HTMLTableRowElement;

	constructor(props: TrProps) {
		super(props, 'tr');
	}
}
