import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface SupProps extends AurumElementProps {
    onAttach?: Callback<Sup>;
    onDetach?: Callback<Sup>;
    onCreate?: Callback<Sup>;
    onDispose?: Callback<Sup>;
}
export declare class Sup extends AurumElement {
    constructor(props: SupProps, children: ChildNode[]);
}
//# sourceMappingURL=sup.d.ts.map