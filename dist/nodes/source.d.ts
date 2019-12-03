import { Callback, StringSource } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';
export interface SourceProps extends AurumElementProps {
    onAttach?: Callback<Source>;
    onDetach?: Callback<Source>;
    onCreate?: Callback<Source>;
    onDispose?: Callback<Source>;
    src?: StringSource;
    srcSet?: StringSource;
    media?: StringSource;
    sizes?: StringSource;
    type?: StringSource;
}
export declare class Source extends AurumElement {
    readonly node: HTMLSourceElement;
    constructor(props: SourceProps);
}
//# sourceMappingURL=source.d.ts.map