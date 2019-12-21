import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface ProgressProps extends AurumElementProps {
    onAttach?: Callback<HTMLProgressElement>;
    onDetach?: Callback<HTMLProgressElement>;
    onCreate?: Callback<HTMLProgressElement>;
    max?: StringSource;
    value?: StringSource;
}
export declare class Progress extends AurumElement {
    node: HTMLProgressElement;
    constructor(props: ProgressProps, children: ChildNode[]);
}
//# sourceMappingURL=progress.d.ts.map