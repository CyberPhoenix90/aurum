import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';
export interface IFrameProps extends AurumElementProps {
    onAttach?: Callback<HTMLIFrameElement>;
    onDetach?: Callback<HTMLIFrameElement>;
    onCreate?: Callback<HTMLIFrameElement>;
    src?: AttributeValue;
    allow?: AttributeValue;
    allowFullscreen?: AttributeValue;
    allowPaymentRequest?: AttributeValue;
    width?: AttributeValue;
    height?: AttributeValue;
    srcdoc?: AttributeValue;
}
export declare class IFrame extends AurumElement {
    readonly node: HTMLIFrameElement;
    constructor(props: IFrameProps, children: ChildNode[]);
}
//# sourceMappingURL=iframe.d.ts.map