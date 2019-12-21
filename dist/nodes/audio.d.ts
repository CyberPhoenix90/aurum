import { Callback, StringSource } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
export interface AudioProps extends AurumElementProps {
    onAttach?: Callback<HTMLAudioElement>;
    onDetach?: Callback<HTMLAudioElement>;
    onCreate?: Callback<HTMLAudioElement>;
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