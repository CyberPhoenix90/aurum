import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';
export interface PreProps extends AurumElementProps {
    onAttach?: Callback<Pre>;
    onDetach?: Callback<Pre>;
    onCreate?: Callback<Pre>;
    onDispose?: Callback<Pre>;
}
export declare class Pre extends AurumElement {
    node: HTMLPreElement;
    constructor(props: PreProps, children: ChildNode[]);
}
//# sourceMappingURL=pre.d.ts.map