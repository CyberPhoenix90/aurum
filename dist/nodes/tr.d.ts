import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface TrProps extends AurumElementProps {
    onAttach?: Callback<Tr>;
    onDetach?: Callback<Tr>;
    onCreate?: Callback<Tr>;
    onDispose?: Callback<Tr>;
}
export declare class Tr extends AurumElement {
    node: HTMLTableRowElement;
    constructor(props: TrProps, children: ChildNode[]);
}
//# sourceMappingURL=tr.d.ts.map