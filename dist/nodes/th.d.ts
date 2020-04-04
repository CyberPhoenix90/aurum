import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface ThProps extends AurumElementProps {
    onAttach?: Callback<HTMLTableHeaderCellElement>;
    onDetach?: Callback<HTMLTableHeaderCellElement>;
    onCreate?: Callback<HTMLTableHeaderCellElement>;
}
/**
 * @internal
 */
export declare class Th extends AurumElement {
    node: HTMLTableHeaderCellElement;
    constructor(props: ThProps, children: ChildNode[]);
}
//# sourceMappingURL=th.d.ts.map