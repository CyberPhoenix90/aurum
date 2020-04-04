import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
export interface AreaProps extends AurumElementProps {
    onAttach?: Callback<HTMLAreaElement>;
    onDetach?: Callback<HTMLAreaElement>;
    onCreate?: Callback<HTMLAreaElement>;
}
/**
 * @internal
 */
export declare class Area extends AurumElement {
    readonly node: HTMLAreaElement;
    constructor(props: AreaProps, children: ChildNode[]);
}
//# sourceMappingURL=area.d.ts.map