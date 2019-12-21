import { Callback, StringSource } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
export interface VideoProps extends AurumElementProps {
    onAttach?: Callback<HTMLVideoElement>;
    onDetach?: Callback<HTMLVideoElement>;
    onCreate?: Callback<HTMLVideoElement>;
    controls?: StringSource;
    autoplay?: StringSource;
    loop?: StringSource;
    muted?: StringSource;
    preload?: StringSource;
    src?: StringSource;
    poster?: StringSource;
    width?: StringSource;
    height?: StringSource;
}
export declare class Video extends AurumElement {
    readonly node: HTMLVideoElement;
    constructor(props: VideoProps, children: ChildNode[]);
}
//# sourceMappingURL=video.d.ts.map