import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface CanvasProps extends AurumElementProps {
    onAttach?: Callback<HTMLCanvasElement>;
    onDetach?: Callback<HTMLCanvasElement>;
    onCreate?: Callback<HTMLCanvasElement>;
    width?: StringSource;
    height?: StringSource;
}
export declare class Canvas extends AurumElement {
    readonly node: HTMLCanvasElement;
    constructor(props: CanvasProps, children: ChildNode[]);
}
//# sourceMappingURL=canvas.d.ts.map