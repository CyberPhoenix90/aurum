import { Callback, StringSource } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
export interface SourceProps extends AurumElementProps {
    onAttach?: Callback<HTMLSourceElement>;
    onDetach?: Callback<HTMLSourceElement>;
    onCreate?: Callback<HTMLSourceElement>;
    src?: StringSource;
    srcSet?: StringSource;
    media?: StringSource;
    sizes?: StringSource;
    type?: StringSource;
}
export declare class Source extends AurumElement {
    readonly node: HTMLSourceElement;
    constructor(props: SourceProps, children: ChildNode[]);
}
//# sourceMappingURL=source.d.ts.map