import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';
export interface LabelProps extends AurumElementProps {
    onAttach?: Callback<HTMLLabelElement>;
    onDetach?: Callback<HTMLLabelElement>;
    onCreate?: Callback<HTMLLabelElement>;
    for?: AttributeValue;
}
export declare class Label extends AurumElement {
    node: HTMLLabelElement;
    constructor(props: LabelProps, children: ChildNode[]);
}
//# sourceMappingURL=label.d.ts.map