import { AurumElement } from './special/aurum_element';
/**
 * @internal
 */
export class Video extends AurumElement {
    constructor(props, children) {
        super(props, children, 'video');
        if (props !== null) {
            this.bindProps(['controls', 'autoplay', 'loop', 'muted', 'preload', 'src', 'poster', 'width', 'height'], props);
        }
    }
}
//# sourceMappingURL=video.js.map