import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface HeadProps extends AurumElementProps {
    onAttach?: Callback<HTMLHeadElement>;
    onDetach?: Callback<HTMLHeadElement>;
    onCreate?: Callback<HTMLHeadElement>;
}
/**
 * @internal
 */
export declare class Head extends AurumElement {
    readonly node: HTMLHeadElement;
    constructor(props: HeadProps, children: ChildNode[]);
}
//# sourceMappingURL=head.d.ts.map