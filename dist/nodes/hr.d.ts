import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';
export interface HrProps extends AurumElementProps {
    onAttach?: Callback<Hr>;
    onDetach?: Callback<Hr>;
    onCreate?: Callback<Hr>;
    onDispose?: Callback<Hr>;
}
export declare class Hr extends AurumElement {
    readonly node: HTMLHRElement;
    constructor(props: HrProps, children: ChildNode[]);
}
//# sourceMappingURL=hr.d.ts.map