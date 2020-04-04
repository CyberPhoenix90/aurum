import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface LiProps extends AurumElementProps {
    onAttach?: Callback<HTMLLIElement>;
    onDetach?: Callback<HTMLLIElement>;
    onCreate?: Callback<HTMLLIElement>;
}
/**
 * @internal
 */
export declare class Li extends AurumElement {
    node: HTMLLIElement;
    constructor(props: LiProps, children: ChildNode[]);
}
//# sourceMappingURL=li.d.ts.map