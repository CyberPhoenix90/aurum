import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource } from '../utilities/common';
export interface IFrameProps extends AurumElementProps {
    onAttach?: (node: IFrame) => void;
    onDettach?: (node: IFrame) => void;
    src?: StringSource;
}
export declare class IFrame extends AurumElement {
    constructor(props: IFrameProps);
}
//# sourceMappingURL=iframe.d.ts.map