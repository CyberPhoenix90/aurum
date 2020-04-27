import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

/**
 * @internal
 */
export class Em extends AurumElement {
	constructor(props: AurumElementProps<HTMLElement>, children: ChildNode[]) {
		super(props, children, 'em');
	}
}
