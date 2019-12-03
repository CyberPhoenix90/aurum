import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';

export interface NoScriptProps extends AurumElementProps {
	onAttach?: Callback<NoScript>;
	onDetach?: Callback<NoScript>;
	onCreate?: Callback<NoScript>;
	onDispose?: Callback<NoScript>;
}

export class NoScript extends AurumElement {
	constructor(props: NoScriptProps) {
		super(props, 'noscript');
	}
}
