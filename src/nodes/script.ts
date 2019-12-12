import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
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

	constructor(props: ScriptProps, children: ChildNode[]) {
		super(props, children, 'script');
		if (props !== null) {
			this.bindProps(['src', 'async', 'defer', 'integrity', 'noModule', 'type'], props);
		}
	}
}
