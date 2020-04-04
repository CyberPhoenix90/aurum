import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface UlProps extends AurumElementProps {
    onAttach?: Callback<HTMLUListElement>;
    onDetach?: Callback<HTMLUListElement>;
    onCreate?: Callback<HTMLUListElement>;
}
/**
 * @internal
 */
export declare class Ul extends AurumElement {
    node: HTMLUListElement;
    constructor(props: UlProps, children: ChildNode[]);
}
//# sourceMappingURL=ul.d.ts.map