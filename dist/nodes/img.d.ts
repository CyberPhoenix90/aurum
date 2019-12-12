import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface ImgProps extends AurumElementProps {
    onAttach?: Callback<Img>;
    onDetach?: Callback<Img>;
    onCreate?: Callback<Img>;
    onDispose?: Callback<Img>;
    src?: StringSource;
    alt?: StringSource;
    width?: StringSource;
    height?: StringSource;
    referrerPolicy?: StringSource;
    sizes?: StringSource;
    srcset?: StringSource;
    useMap?: StringSource;
}
export declare class Img extends AurumElement {
    readonly node: HTMLImageElement;
    constructor(props: ImgProps, children: ChildNode[]);
}
//# sourceMappingURL=img.d.ts.map