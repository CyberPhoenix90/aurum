import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface TrProps extends AurumElementProps {
    onAttach?: Callback<HTMLTableRowElement>;
    onDetach?: Callback<HTMLTableRowElement>;
    onCreate?: Callback<HTMLTableRowElement>;
}
/**
 * @internal
 */
export declare class Tr extends AurumElement {
    node: HTMLTableRowElement;
    constructor(props: TrProps, children: ChildNode[]);
}
//# sourceMappingURL=tr.d.ts.map