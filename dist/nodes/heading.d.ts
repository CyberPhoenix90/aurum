import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface HeadingProps extends AurumElementProps {
    onAttach?: Callback<Heading>;
    onDetach?: Callback<Heading>;
    onCreate?: Callback<Heading>;
    onDispose?: Callback<Heading>;
}
export declare class Heading extends AurumElement {
    readonly node: HTMLHeadingElement;
    constructor(props: HeadingProps, children: ChildNode[]);
}
//# sourceMappingURL=heading.d.ts.map