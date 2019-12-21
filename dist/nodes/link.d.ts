import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface LinkProps extends AurumElementProps {
    onAttach?: Callback<HTMLLinkElement>;
    onDetach?: Callback<HTMLLinkElement>;
    onCreate?: Callback<HTMLLinkElement>;
    href?: StringSource;
    rel?: StringSource;
    media?: StringSource;
    as?: StringSource;
    disabled?: StringSource;
    type?: StringSource;
}
export declare class Link extends AurumElement {
    node: HTMLLinkElement;
    constructor(props: LinkProps, children: ChildNode[]);
}
//# sourceMappingURL=link.d.ts.map