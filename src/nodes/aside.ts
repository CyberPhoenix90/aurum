import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';

/**
 * @internal
 */
export class Aside extends AurumElement {
	constructor(props: AurumElementProps<HTMLElement>, children: ChildNode[]) {
		super(props, children, 'aside');
	}
}
