import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

/**
 * @internal
 */
export class Article extends AurumElement {
	constructor(props: AurumElementProps<HTMLElement>, children: ChildNode[]) {
		super(props, children, 'article');
	}
}
