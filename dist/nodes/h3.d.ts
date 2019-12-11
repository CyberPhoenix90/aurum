import { AurumElement, ChildNode, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';
export interface H3Props extends AurumElementProps {
    onAttach?: Callback<H3>;
    onDetach?: Callback<H3>;
    onCreate?: Callback<H3>;
    onDispose?: Callback<H3>;
}
export declare class H3 extends AurumElement {
    constructor(props: H3Props, children: ChildNode[]);
}
//# sourceMappingURL=h3.d.ts.map