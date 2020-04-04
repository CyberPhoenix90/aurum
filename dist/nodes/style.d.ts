import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';
export interface StyleProps extends AurumElementProps {
    onAttach?: Callback<HTMLStyleElement>;
    onDetach?: Callback<HTMLStyleElement>;
    onCreate?: Callback<HTMLStyleElement>;
    media?: AttributeValue;
}
/**
 * @internal
 */
export declare class Style extends AurumElement {
    node: HTMLStyleElement;
    constructor(props: StyleProps, children: ChildNode[]);
}
//# sourceMappingURL=style.d.ts.map