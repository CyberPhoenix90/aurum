import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

export interface NoScriptProps extends AurumElementProps {
	onAttach?: Callback<NoScript>;
	onDetach?: Callback<NoScript>;
	onCreate?: Callback<NoScript>;
	onDispose?: Callback<NoScript>;
}

export class NoScript extends AurumElement {
	constructor(props: NoScriptProps, children: ChildNode[]) {
		super(props, children, 'noscript');
	}
}
