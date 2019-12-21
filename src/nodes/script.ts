import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';

export interface ScriptProps extends AurumElementProps {
	onAttach?: Callback<HTMLScriptElement>;
	onDetach?: Callback<HTMLScriptElement>;
	onCreate?: Callback<HTMLScriptElement>;
	src?: StringSource;
	async?: StringSource;
	defer?: StringSource;
	integrity?: StringSource;
	noModule?: StringSource;
	type?: StringSource;
}

/**
 * @internal
 */
export class Script extends AurumElement {
	public node: HTMLScriptElement;

	constructor(props: ScriptProps, children: ChildNode[]) {
		super(props, children, 'script');
		if (props !== null) {
			this.bindProps(['src', 'async', 'defer', 'integrity', 'noModule', 'type'], props);
		}
	}
}
