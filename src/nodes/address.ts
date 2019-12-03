import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';

export interface AddressProps extends AurumElementProps {
	onAttach?: Callback<Address>;
	onDetach?: Callback<Address>;
	onCreate?: Callback<Address>;
	onDispose?: Callback<Address>;
}

export class Address extends AurumElement {
	constructor(props: AddressProps) {
		super(props, 'address');
	}
}
