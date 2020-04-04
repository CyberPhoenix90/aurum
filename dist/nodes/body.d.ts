import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface BodyProps extends AurumElementProps {
    onAttach?: Callback<HTMLBodyElement>;
    onDetach?: Callback<HTMLBodyElement>;
    onCreate?: Callback<HTMLBodyElement>;
}
/**
 * @internal
 */
export declare class Body extends AurumElement {
    readonly node: HTMLBodyElement;
    constructor(props: BodyProps, children: ChildNode[]);
}
//# sourceMappingURL=body.d.ts.map