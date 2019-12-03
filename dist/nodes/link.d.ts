import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface LinkProps extends AurumElementProps {
    onAttach?: Callback<Link>;
    onDetach?: Callback<Link>;
    onCreate?: Callback<Link>;
    onDispose?: Callback<Link>;
    href?: StringSource;
    rel?: StringSource;
    media?: StringSource;
    as?: StringSource;
    disabled?: StringSource;
    type?: StringSource;
}
export declare class Link extends AurumElement {
    node: HTMLLinkElement;
    constructor(props: LinkProps);
}
//# sourceMappingURL=link.d.ts.map