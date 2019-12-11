import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';
export interface OlProps extends AurumElementProps {
    onAttach?: Callback<Ol>;
    onDetach?: Callback<Ol>;
    onCreate?: Callback<Ol>;
    onDispose?: Callback<Ol>;
}
export declare class Ol extends AurumElement {
    node: HTMLOListElement;
    constructor(props: OlProps, children: ChildNode[]);
}
//# sourceMappingURL=ol.d.ts.map