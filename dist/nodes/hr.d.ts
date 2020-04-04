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
export declare class Hr extends AurumElement {
    readonly node: HTMLHRElement;
    constructor(props: HrProps, children: ChildNode[]);
}
//# sourceMappingURL=hr.d.ts.map