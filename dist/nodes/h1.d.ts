import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';
export interface H1Props extends AurumElementProps {
    onAttach?: Callback<H1>;
    onDetach?: Callback<H1>;
    onCreate?: Callback<H1>;
    onDispose?: Callback<H1>;
}
export declare class H1 extends AurumElement {
    constructor(props: H1Props, children: ChildNode[]);
}
//# sourceMappingURL=h1.d.ts.map