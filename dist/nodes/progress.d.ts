import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface ProgressProps extends AurumElementProps {
    onAttach?: Callback<Progress>;
    onDetach?: Callback<Progress>;
    onCreate?: Callback<Progress>;
    onDispose?: Callback<Progress>;
    max?: StringSource;
    value?: StringSource;
}
export declare class Progress extends AurumElement {
    node: HTMLProgressElement;
    constructor(props: ProgressProps);
}
//# sourceMappingURL=progress.d.ts.map