import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface SpanProps extends AurumElementProps {
    onAttach?: Callback<HTMLSpanElement>;
    onDetach?: Callback<HTMLSpanElement>;
    onCreate?: Callback<HTMLSpanElement>;
}
export declare class Span extends AurumElement {
    node: HTMLSpanElement;
    constructor(props: SpanProps, children: ChildNode[]);
}
//# sourceMappingURL=span.d.ts.map