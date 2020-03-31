import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';
export interface LinkProps extends AurumElementProps {
    onAttach?: Callback<HTMLLinkElement>;
    onDetach?: Callback<HTMLLinkElement>;
    onCreate?: Callback<HTMLLinkElement>;
    href?: AttributeValue;
    rel?: AttributeValue;
    media?: AttributeValue;
    as?: AttributeValue;
    disabled?: AttributeValue;
    type?: AttributeValue;
}
export declare class Link extends AurumElement {
    node: HTMLLinkElement;
    constructor(props: LinkProps, children: ChildNode[]);
}
//# sourceMappingURL=link.d.ts.map