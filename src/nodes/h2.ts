import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

/**
 * @internal
 */
export class H2 extends AurumElement {
	constructor(props: AurumElementProps, children: ChildNode[]) {
		super(props, children, 'h2');
	}
}
