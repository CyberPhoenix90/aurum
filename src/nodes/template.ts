import { AurumElement, AurumElementProps } from './aurum_element';

export interface TemplateProps<T> extends AurumElementProps {
	onAttach?(entity: Template<T>): void;
	onDetach?(entity: Template<T>): void;
	generator(model: T): AurumElement;
	ref?: string;
}

export class Template<T> extends AurumElement {
	public generate: (model: T) => AurumElement;
	ref: string;

	constructor(props: TemplateProps<T>) {
		super(props);
		this.ref = props.ref;
		this.generate = props.generator;
	}

	public create(props: TemplateProps<T>): HTMLElement {
		const input = document.createElement('template');
		return input;
	}
}
