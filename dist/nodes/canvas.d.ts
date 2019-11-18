import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource } from '../utilities/common';
export interface CanvasProps extends AurumElementProps {
    width?: StringSource;
    height?: StringSource;
}
export declare class Canvas extends AurumElement {
    constructor(props: CanvasProps);
}
//# sourceMappingURL=canvas.d.ts.map