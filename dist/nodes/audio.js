import { AurumElement } from './special/aurum_element';
/**
 * @internal
 */
export class Audio extends AurumElement {
    constructor(props, children) {
        super(props, children, 'audio');
        if (props !== null) {
            this.bindProps(['controls', 'autoplay', 'loop', 'muted', 'preload', 'src'], props);
        }
    }
}
//# sourceMappingURL=audio.js.map