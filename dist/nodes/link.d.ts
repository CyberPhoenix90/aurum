import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource } from '../utilities/common';
export interface LinkProps extends AurumElementProps {
    onAttach?: (node: Link) => void;
    onDettach?: (node: Link) => void;
    href?: StringSource;
    rel?: StringSource;
}
export declare class Link extends AurumElement {
    constructor(props: LinkProps);
}
//# sourceMappingURL=link.d.ts.map