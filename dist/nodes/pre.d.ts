import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface PreProps extends AurumElementProps {
    onAttach?: Callback<HTMLPreElement>;
    onDetach?: Callback<HTMLPreElement>;
    onCreate?: Callback<HTMLPreElement>;
}
/**
 * @internal
 */
export declare class Pre extends AurumElement {
    node: HTMLPreElement;
    constructor(props: PreProps, children: ChildNode[]);
}
//# sourceMappingURL=pre.d.ts.map