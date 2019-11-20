import { AurumElement, AurumElementProps } from './aurum_element';

export interface TrProps extends AurumElementProps {}

export class Tr extends AurumElement {
	constructor(props: TrProps) {
		super(props, 'tr');
	}
}
