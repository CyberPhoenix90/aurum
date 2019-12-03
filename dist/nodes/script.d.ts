import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface ScriptProps extends AurumElementProps {
    onAttach?: Callback<Script>;
    onDetach?: Callback<Script>;
    onCreate?: Callback<Script>;
    onDispose?: Callback<Script>;
    src?: StringSource;
    async?: StringSource;
    defer?: StringSource;
    integrity?: StringSource;
    noModule?: StringSource;
    type?: StringSource;
}
export declare class Script extends AurumElement {
    node: HTMLScriptElement;
    constructor(props: ScriptProps);
}
//# sourceMappingURL=script.d.ts.map