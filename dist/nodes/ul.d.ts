import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';
export interface UlProps extends AurumElementProps {
    onAttach?: Callback<Ul>;
    onDetach?: Callback<Ul>;
    onCreate?: Callback<Ul>;
    onDispose?: Callback<Ul>;
}
export declare class Ul extends AurumElement {
    node: HTMLUListElement;
    constructor(props: UlProps, children: ChildNode[]);
}
//# sourceMappingURL=ul.d.ts.map