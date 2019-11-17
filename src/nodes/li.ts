import { AurumElement, AurumElementProps } from './aurum_element';

export interface LiProps extends AurumElementProps {}

export class Li extends AurumElement {
	constructor(props: LiProps) {
		super(props);
	}

	public create(props: LiProps): HTMLElement {
		const li = document.createElement('li');
		return li;
	}
}
