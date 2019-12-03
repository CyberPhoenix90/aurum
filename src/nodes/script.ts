import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface ScriptProps extends AurumElementProps {
	onAttach?: Callback<Script>;
	onDetach?: Callback<Script>;
	onCreate?: Callback<Script>;
	onDispose?: Callback<Script>;
	src?: StringSource;
	async?: StringSource;
	defer?: StringSource;
	integrity?: StringSource;
	noModule?: StringSource;
	type?: StringSource;
}

export class Script extends AurumElement {
	public node: HTMLScriptElement;

	constructor(props: ScriptProps) {
		super(props, 'script');
		this.bindProps(['src', 'async', 'defer', 'integrity', 'noModule', 'type'], props);
	}
}
