import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

/**
 * @internal
 */
export class B extends AurumElement {
	constructor(props: AurumElementProps, children: ChildNode[]) {
		super(props, children, 'b');
	}
}
