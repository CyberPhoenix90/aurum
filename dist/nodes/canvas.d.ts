import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface CanvasProps extends AurumElementProps {
    onAttach?: Callback<Canvas>;
    onDetach?: Callback<Canvas>;
    onCreate?: Callback<Canvas>;
    onDispose?: Callback<Canvas>;
    width?: StringSource;
    height?: StringSource;
}
export declare class Canvas extends AurumElement {
    readonly node: HTMLCanvasElement;
    constructor(props: CanvasProps);
}
//# sourceMappingURL=canvas.d.ts.map