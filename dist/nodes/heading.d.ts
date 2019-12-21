import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface HeadingProps extends AurumElementProps {
    onAttach?: Callback<HTMLHeadingElement>;
    onDetach?: Callback<HTMLHeadingElement>;
    onCreate?: Callback<HTMLHeadingElement>;
}
export declare class Heading extends AurumElement {
    readonly node: HTMLHeadingElement;
    constructor(props: HeadingProps, children: ChildNode[]);
}
//# sourceMappingURL=heading.d.ts.map