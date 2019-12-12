import { AurumElement, AurumElementProps, Template, ChildNode } from './aurum_element';
import { MapLike, Provider } from '../../utilities/common';

export interface SuspenseProps<T = boolean> extends AurumElementProps {
	loader: Provider<Promise<AurumElement>>;
}

export class Suspense<T = boolean> extends AurumElement {
	public templateMap: MapLike<Template<void>>;
	public template: Template<void>;

	constructor(props: SuspenseProps<T>, children: ChildNode[]) {
		super(props, children, 'suspense');

		props.loader().then((newElement) => {
			this.clearChildren();
			this.addChild(newElement);
		});
	}
}
