import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface TdProps extends AurumElementProps {
    onAttach?: Callback<Td>;
    onDetach?: Callback<Td>;
    onCreate?: Callback<Td>;
    onDispose?: Callback<Td>;
}
export declare class Td extends AurumElement {
    node: HTMLTableColElement;
    constructor(props: TdProps, children: ChildNode[]);
}
//# sourceMappingURL=td.d.ts.map