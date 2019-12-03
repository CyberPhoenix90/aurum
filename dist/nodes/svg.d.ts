import { Callback, StringSource } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';
export interface SvgProps extends AurumElementProps {
    onAttach?: Callback<Svg>;
    onDetach?: Callback<Svg>;
    onCreate?: Callback<Svg>;
    onDispose?: Callback<Svg>;
    width?: StringSource;
    height?: StringSource;
}
export declare class Svg extends AurumElement {
    constructor(props: SvgProps);
}
//# sourceMappingURL=svg.d.ts.map