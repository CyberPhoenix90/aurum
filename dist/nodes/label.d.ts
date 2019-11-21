import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource } from '../utilities/common';
export interface LabelProps extends AurumElementProps {
    onAttach?: (node: Label) => void;
    onDettach?: (node: Label) => void;
    for?: StringSource;
}
export declare class Label extends AurumElement {
    constructor(props: LabelProps);
}
//# sourceMappingURL=label.d.ts.map