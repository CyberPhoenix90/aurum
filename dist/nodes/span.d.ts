import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface SpanProps extends AurumElementProps {
    onAttach?: Callback<Span>;
    onDetach?: Callback<Span>;
    onCreate?: Callback<Span>;
    onDispose?: Callback<Span>;
}
export declare class Span extends AurumElement {
    node: HTMLSpanElement;
    constructor(props: SpanProps, children: ChildNode[]);
}
//# sourceMappingURL=span.d.ts.map