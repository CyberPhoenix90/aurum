import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface DataProps extends AurumElementProps {
	onAttach?: Callback<Data>;
	onDetach?: Callback<Data>;
	onCreate?: Callback<Data>;
	onDispose?: Callback<Data>;
	value?: StringSource;
}

export class Data extends AurumElement {
	public node: HTMLDataElement;

	constructor(props: DataProps) {
		super(props, 'data');
		this.bindProps(['datalue'], props);
	}
}
