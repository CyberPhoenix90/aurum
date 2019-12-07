import { Callback, StringSource } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';

export interface SvgProps extends AurumElementProps {
	onAttach?: Callback<Svg>;
	onDetach?: Callback<Svg>;
	onCreate?: Callback<Svg>;
	onDispose?: Callback<Svg>;
	width?: StringSource;
	height?: StringSource;
}

export class Svg extends AurumElement {
	constructor(props: SvgProps) {
		super(props, 'svg');
		if (props !== null) {
			this.bindProps(['width', 'height'], props);
		}
	}
}
