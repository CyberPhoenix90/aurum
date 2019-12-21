import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';

/**
 * @internal
 */
export class Aside extends AurumElement {
	constructor(props: AurumElementProps, children: ChildNode[]) {
		super(props, children, 'aside');
	}
}
