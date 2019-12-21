import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface BrProps extends AurumElementProps {
    onAttach?: Callback<HTMLBRElement>;
    onDetach?: Callback<HTMLBRElement>;
    onCreate?: Callback<HTMLBRElement>;
}
export declare class Br extends AurumElement {
    readonly node: HTMLBRElement;
    constructor(props: BrProps, children: ChildNode[]);
}
//# sourceMappingURL=br.d.ts.map