import { Callback, AttributeValue } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
export interface SourceProps extends AurumElementProps {
    onAttach?: Callback<HTMLSourceElement>;
    onDetach?: Callback<HTMLSourceElement>;
    onCreate?: Callback<HTMLSourceElement>;
    src?: AttributeValue;
    srcSet?: AttributeValue;
    media?: AttributeValue;
    sizes?: AttributeValue;
    type?: AttributeValue;
}
/**
 * @internal
 */
export declare class Source extends AurumElement {
    readonly node: HTMLSourceElement;
    constructor(props: SourceProps, children: ChildNode[]);
}
//# sourceMappingURL=source.d.ts.map