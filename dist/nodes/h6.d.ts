import { AurumElement, ChildNode, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';
export interface H6Props extends AurumElementProps {
    onAttach?: Callback<H6>;
    onDetach?: Callback<H6>;
    onCreate?: Callback<H6>;
    onDispose?: Callback<H6>;
}
export declare class H6 extends AurumElement {
    constructor(props: H6Props, children: ChildNode[]);
}
//# sourceMappingURL=h6.d.ts.map