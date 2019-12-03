import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface LabelProps extends AurumElementProps {
    onAttach?: Callback<Label>;
    onDetach?: Callback<Label>;
    onCreate?: Callback<Label>;
    onDispose?: Callback<Label>;
    for?: StringSource;
}
export declare class Label extends AurumElement {
    node: HTMLLabelElement;
    constructor(props: LabelProps);
}
//# sourceMappingURL=label.d.ts.map