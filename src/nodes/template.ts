import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';

export interface TemplateProps<T> extends AurumElementProps {
	onAttach?(entity: Template<T>): void;
	onDetach?(entity: Template<T>): void;
	generator(model: T): AurumElement;
	ref?: string | number;
}

export class Template<T> extends AurumElement {
	public generate: (model: T) => AurumElement;
	ref: string | number;

	constructor(props: TemplateProps<T>, children: ChildNode[]) {
		super(props, children, 'template');
		this.ref = props.ref;
		this.generate = props.generator;
	}
}
