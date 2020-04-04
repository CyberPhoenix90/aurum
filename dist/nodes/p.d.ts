import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface PProps extends AurumElementProps {
    onAttach?: Callback<HTMLParagraphElement>;
    onDetach?: Callback<HTMLParagraphElement>;
    onCreate?: Callback<HTMLParagraphElement>;
}
/**
 * @internal
 */
export declare class P extends AurumElement {
    node: HTMLParagraphElement;
    constructor(props: PProps, children: ChildNode[]);
}
//# sourceMappingURL=p.d.ts.map