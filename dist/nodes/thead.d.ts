import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface TheadProps extends AurumElementProps {
    onAttach?: Callback<Thead>;
    onDetach?: Callback<Thead>;
    onCreate?: Callback<Thead>;
    onDispose?: Callback<Thead>;
}
export declare class Thead extends AurumElement {
    constructor(props: TheadProps, children: ChildNode[]);
}
//# sourceMappingURL=thead.d.ts.map