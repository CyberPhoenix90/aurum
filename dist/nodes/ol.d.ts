import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface OlProps extends AurumElementProps {
    onAttach?: Callback<HTMLOListElement>;
    onDetach?: Callback<HTMLOListElement>;
    onCreate?: Callback<HTMLOListElement>;
}
export declare class Ol extends AurumElement {
    node: HTMLOListElement;
    constructor(props: OlProps, children: ChildNode[]);
}
//# sourceMappingURL=ol.d.ts.map