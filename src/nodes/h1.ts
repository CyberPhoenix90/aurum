import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

/**
 * @internal
 */
export class H1 extends AurumElement {
	constructor(props: AurumElementProps, children: ChildNode[]) {
		super(props, children, 'h1');
	}
}
