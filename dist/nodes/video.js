import { AurumElement } from './aurum_element';
export class Video extends AurumElement {
    constructor(props) {
        super(props, 'video');
        this.bindProps(['controls', 'autoplay', 'loop', 'muted', 'preload', 'src', 'poster', 'width', 'height'], props);
    }
}
//# sourceMappingURL=video.js.map