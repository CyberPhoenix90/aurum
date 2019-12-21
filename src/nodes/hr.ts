import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';

export interface HrProps extends AurumElementProps {
	onAttach?: Callback<HTMLHRElement>;
	onDetach?: Callback<HTMLHRElement>;
	onCreate?: Callback<HTMLHRElement>;
}

/**
 * @internal
 */
export class Hr extends AurumElement {
	public readonly node: HTMLHRElement;

	constructor(props: HrProps, children: ChildNode[]) {
		super(props, children, 'hr');
	}
}
