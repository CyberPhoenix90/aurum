import { Callback, AttributeValue } from '../utilities/common';
import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
export interface AProps extends AurumElementProps {
    onAttach?: Callback<HTMLAnchorElement>;
    onDetach?: Callback<HTMLAnchorElement>;
    onCreate?: Callback<HTMLAnchorElement>;
    href?: AttributeValue;
    target?: AttributeValue;
}
export declare class A extends AurumElement {
    readonly node: HTMLAnchorElement;
    constructor(props: AProps, children: ChildNode[]);
}
//# sourceMappingURL=a.d.ts.map