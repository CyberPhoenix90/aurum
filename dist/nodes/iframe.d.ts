import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface IFrameProps extends AurumElementProps {
    onAttach?: Callback<HTMLIFrameElement>;
    onDetach?: Callback<HTMLIFrameElement>;
    onCreate?: Callback<HTMLIFrameElement>;
    src?: StringSource;
    allow?: StringSource;
    allowFullscreen?: StringSource;
    allowPaymentRequest?: StringSource;
    width?: StringSource;
    height?: StringSource;
    srcdoc?: StringSource;
}
export declare class IFrame extends AurumElement {
    readonly node: HTMLIFrameElement;
    constructor(props: IFrameProps, children: ChildNode[]);
}
//# sourceMappingURL=iframe.d.ts.map