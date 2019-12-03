import { AurumElement } from './aurum_element';
export class Audio extends AurumElement {
    constructor(props) {
        super(props, 'audio');
        this.bindProps(['controls', 'autoplay', 'loop', 'muted', 'preload', 'src'], props);
    }
}
//# sourceMappingURL=audio.js.map