import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface TdProps extends AurumElementProps {
    onAttach?: Callback<HTMLTableColElement>;
    onDetach?: Callback<HTMLTableColElement>;
    onCreate?: Callback<HTMLTableColElement>;
}
export declare class Td extends AurumElement {
    node: HTMLTableColElement;
    constructor(props: TdProps, children: ChildNode[]);
}
//# sourceMappingURL=td.d.ts.map