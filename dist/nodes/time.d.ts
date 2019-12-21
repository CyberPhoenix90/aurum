import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, StringSource } from '../utilities/common';
export interface TimeProps extends AurumElementProps {
    onAttach?: Callback<HTMLTimeElement>;
    onDetach?: Callback<HTMLTimeElement>;
    onCreate?: Callback<HTMLTimeElement>;
    datetime?: StringSource;
}
export declare class Time extends AurumElement {
    node: HTMLTimeElement;
    constructor(props: TimeProps, children: ChildNode[]);
}
//# sourceMappingURL=time.d.ts.map