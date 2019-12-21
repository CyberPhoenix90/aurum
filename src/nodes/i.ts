import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

/**
 * @internal
 */
export class I extends AurumElement {
	constructor(props: AurumElementProps, children: ChildNode[]) {
		super(props, children, 'i');
	}
}
