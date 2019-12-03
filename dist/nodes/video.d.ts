import { Callback, StringSource } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';
export interface VideoProps extends AurumElementProps {
    onAttach?: Callback<Video>;
    onDetach?: Callback<Video>;
    onCreate?: Callback<Video>;
    onDispose?: Callback<Video>;
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
    constructor(props: VideoProps);
}
//# sourceMappingURL=video.d.ts.map