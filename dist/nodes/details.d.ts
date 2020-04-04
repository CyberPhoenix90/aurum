import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface DetailsProps extends AurumElementProps {
    onAttach?: Callback<HTMLDetailsElement>;
    onDetach?: Callback<HTMLDetailsElement>;
    onCreate?: Callback<HTMLDetailsElement>;
}
/**
 * @internal
 */
export declare class Details extends AurumElement {
    readonly node: HTMLDetailsElement;
    constructor(props: DetailsProps, children: ChildNode[]);
}
//# sourceMappingURL=details.d.ts.map