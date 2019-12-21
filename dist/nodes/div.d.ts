import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface DivProps extends AurumElementProps {
    onAttach?: Callback<HTMLDivElement>;
    onDetach?: Callback<HTMLDivElement>;
    onCreate?: Callback<HTMLDivElement>;
}
export declare class Div extends AurumElement {
    readonly node: HTMLDivElement;
    constructor(props: DivProps, children: ChildNode[]);
}
//# sourceMappingURL=div.d.ts.map