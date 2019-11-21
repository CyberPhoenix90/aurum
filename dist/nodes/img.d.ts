import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource } from '../utilities/common';
export interface ImgProps extends AurumElementProps {
    onAttach?: (node: Img) => void;
    onDettach?: (node: Img) => void;
    src?: StringSource;
}
export declare class Img extends AurumElement {
    constructor(props: ImgProps);
}
//# sourceMappingURL=img.d.ts.map