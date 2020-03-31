import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';
export interface ImgProps extends AurumElementProps {
    onAttach?: Callback<HTMLImageElement>;
    onDetach?: Callback<HTMLImageElement>;
    onCreate?: Callback<HTMLImageElement>;
    src?: AttributeValue;
    alt?: AttributeValue;
    width?: AttributeValue;
    height?: AttributeValue;
    referrerPolicy?: AttributeValue;
    sizes?: AttributeValue;
    srcset?: AttributeValue;
    useMap?: AttributeValue;
}
export declare class Img extends AurumElement {
    readonly node: HTMLImageElement;
    constructor(props: ImgProps, children: ChildNode[]);
}
//# sourceMappingURL=img.d.ts.map