import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface TemplateProps extends AurumElementProps<HTMLTemplateElement> {
	onAttach?: Callback<HTMLTemplateElement>;
	onDetach?: Callback<HTMLTemplateElement>;
	onCreate?: Callback<HTMLTemplateElement>;
}

/**
 * @internal
 */
export class Template extends AurumElement {
	constructor(props: TemplateProps, children: ChildNode[]) {
		super(props, children, 'template');
	}
}
