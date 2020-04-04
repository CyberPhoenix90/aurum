import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';
export interface TimeProps extends AurumElementProps {
    onAttach?: Callback<HTMLTimeElement>;
    onDetach?: Callback<HTMLTimeElement>;
    onCreate?: Callback<HTMLTimeElement>;
    datetime?: AttributeValue;
}
/**
 * @internal
 */
export declare class Time extends AurumElement {
    node: HTMLTimeElement;
    constructor(props: TimeProps, children: ChildNode[]);
}
//# sourceMappingURL=time.d.ts.map