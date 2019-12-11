import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';
export interface BProps extends AurumElementProps {
    onAttach?: Callback<B>;
    onDetach?: Callback<B>;
    onCreate?: Callback<B>;
    onDispose?: Callback<B>;
}
export declare class B extends AurumElement {
    constructor(props: BProps, children: ChildNode[]);
}
//# sourceMappingURL=b.d.ts.map