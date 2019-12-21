import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

/**
 * @internal
 */
export class Address extends AurumElement {
	constructor(props: AurumElementProps, children: ChildNode[]) {
		super(props, children, 'address');
	}
}
