import { AurumElement, ChildNode, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';
export interface H4Props extends AurumElementProps {
    onAttach?: Callback<H4>;
    onDetach?: Callback<H4>;
    onCreate?: Callback<H4>;
    onDispose?: Callback<H4>;
}
export declare class H4 extends AurumElement {
    constructor(props: H4Props, children: ChildNode[]);
}
//# sourceMappingURL=h4.d.ts.map