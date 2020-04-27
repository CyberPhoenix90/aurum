import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';

export interface ScriptProps extends AurumElementProps<HTMLScriptElement> {
	onAttach?: Callback<HTMLScriptElement>;
	onDetach?: Callback<HTMLScriptElement>;
	onCreate?: Callback<HTMLScriptElement>;
	src?: AttributeValue;
	async?: AttributeValue;
	defer?: AttributeValue;
	integrity?: AttributeValue;
	noModule?: AttributeValue;
	type?: AttributeValue;
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
