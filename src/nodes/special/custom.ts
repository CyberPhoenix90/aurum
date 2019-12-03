import { AurumElement, AurumElementProps } from '../../aurumjs';
import { Callback, MapLike, StringSource } from '../../utilities/common';

export interface CustomProps<T extends HTMLElement> extends AurumElementProps {
	onAttach?: Callback<Custom<T>>;
	onDetach?: Callback<Custom<T>>;
	onCreate?: Callback<Custom<T>>;
	onDispose?: Callback<Custom<T>>;

	attributes?: MapLike<StringSource>;
	tag: string;
}

export class Custom<T extends HTMLElement> extends AurumElement {
	public readonly node: T;

	constructor(props: CustomProps<T>) {
		super(props, props.tag);
		if (props.attributes) {
			this.bindProps(Object.keys(props.attributes), props.attributes);
		}
	}
}
