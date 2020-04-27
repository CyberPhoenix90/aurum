import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

/**
 * @internal
 */
export class Sub extends AurumElement {
	constructor(props: AurumElementProps<HTMLElement>, children: ChildNode[]) {
		super(props, children, 'sub');
	}
}
