import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface QProps extends AurumElementProps {
    onAttach?: Callback<Q>;
    onDetach?: Callback<Q>;
    onCreate?: Callback<Q>;
    onDispose?: Callback<Q>;
}
export declare class Q extends AurumElement {
    node: HTMLQuoteElement;
    constructor(props: QProps, children: ChildNode[]);
}
//# sourceMappingURL=q.d.ts.map