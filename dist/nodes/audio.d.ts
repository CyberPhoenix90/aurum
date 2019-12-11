import { Callback, StringSource } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
export interface AudioProps extends AurumElementProps {
    onAttach?: Callback<Audio>;
    onDetach?: Callback<Audio>;
    onCreate?: Callback<Audio>;
    onDispose?: Callback<Audio>;
    controls?: StringSource;
    autoplay?: StringSource;
    loop?: StringSource;
    muted?: StringSource;
    preload?: StringSource;
    src?: StringSource;
}
export declare class Audio extends AurumElement {
    readonly node: HTMLAudioElement;
    constructor(props: AudioProps, children: ChildNode[]);
}
//# sourceMappingURL=audio.d.ts.map