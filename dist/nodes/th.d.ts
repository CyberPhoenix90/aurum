import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface ThProps extends AurumElementProps {
    onAttach?: Callback<Th>;
    onDetach?: Callback<Th>;
    onCreate?: Callback<Th>;
    onDispose?: Callback<Th>;
}
export declare class Th extends AurumElement {
    node: HTMLTableHeaderCellElement;
    constructor(props: ThProps, children: ChildNode[]);
}
//# sourceMappingURL=th.d.ts.map