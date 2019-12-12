import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface H5Props extends AurumElementProps {
    onAttach?: Callback<H5>;
    onDetach?: Callback<H5>;
    onCreate?: Callback<H5>;
    onDispose?: Callback<H5>;
}
export declare class H5 extends AurumElement {
    constructor(props: H5Props, children: ChildNode[]);
}
//# sourceMappingURL=h5.d.ts.map