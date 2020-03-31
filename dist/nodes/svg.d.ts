import { Callback, AttributeValue } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
export interface SvgProps extends AurumElementProps {
    onAttach?: Callback<HTMLOrSVGElement>;
    onDetach?: Callback<HTMLOrSVGElement>;
    onCreate?: Callback<HTMLOrSVGElement>;
    width?: AttributeValue;
    height?: AttributeValue;
}
export declare class Svg extends AurumElement {
    constructor(props: SvgProps, children: ChildNode[]);
}
//# sourceMappingURL=svg.d.ts.map