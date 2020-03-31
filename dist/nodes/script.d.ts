import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';
export interface ScriptProps extends AurumElementProps {
    onAttach?: Callback<HTMLScriptElement>;
    onDetach?: Callback<HTMLScriptElement>;
    onCreate?: Callback<HTMLScriptElement>;
    src?: AttributeValue;
    async?: AttributeValue;
    defer?: AttributeValue;
    integrity?: AttributeValue;
    noModule?: AttributeValue;
    type?: AttributeValue;
}
export declare class Script extends AurumElement {
    node: HTMLScriptElement;
    constructor(props: ScriptProps, children: ChildNode[]);
}
//# sourceMappingURL=script.d.ts.map