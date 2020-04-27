import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

/**
 * @internal
 */
export class Thead extends AurumElement {
	constructor(props: AurumElementProps<HTMLElement>, children: ChildNode[]) {
		super(props, children, 'thead');
	}
}
