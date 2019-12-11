import { AurumElement } from './aurum_element';
export class Audio extends AurumElement {
    constructor(props, children) {
        super(props, children, 'audio');
        if (props !== null) {
            this.bindProps(['controls', 'autoplay', 'loop', 'muted', 'preload', 'src'], props);
        }
    }
}
//# sourceMappingURL=audio.js.map