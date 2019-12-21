import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface QProps extends AurumElementProps {
    onAttach?: Callback<HTMLQuoteElement>;
    onDetach?: Callback<HTMLQuoteElement>;
    onCreate?: Callback<HTMLQuoteElement>;
}
export declare class Q extends AurumElement {
    node: HTMLQuoteElement;
    constructor(props: QProps, children: ChildNode[]);
}
//# sourceMappingURL=q.d.ts.map