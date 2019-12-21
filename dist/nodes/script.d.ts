import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface ScriptProps extends AurumElementProps {
    onAttach?: Callback<HTMLScriptElement>;
    onDetach?: Callback<HTMLScriptElement>;
    onCreate?: Callback<HTMLScriptElement>;
    src?: StringSource;
    async?: StringSource;
    defer?: StringSource;
    integrity?: StringSource;
    noModule?: StringSource;
    type?: StringSource;
}
export declare class Script extends AurumElement {
    node: HTMLScriptElement;
    constructor(props: ScriptProps, children: ChildNode[]);
}
//# sourceMappingURL=script.d.ts.map