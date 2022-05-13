import { Behavior, EntityModel, inject } from '../../core/entity';
import { aurumMouse } from '../../input/mouse/mouse';
import { readData } from '../../utilities/data';
import { BoundingBox2D } from '../traits/bounding_box2D';

export class Clickable extends Behavior<MouseEvent> {
    @inject(BoundingBox2D)
    private boundingBox: BoundingBox2D;
    private onMouseDown: (event: MouseEvent) => void;
    private onMouseUp: (event: MouseEvent) => void;

    constructor(onMouseDown: (event: MouseEvent) => void, onMouseUp: (event: MouseEvent) => void) {
        super([aurumMouse.mouseDown, aurumMouse.mouseUp]);

        this.onMouseDown = onMouseDown;
        this.onMouseUp = onMouseUp;
    }

    public onAttach(owner: EntityModel): void {
        super.onAttach(owner);
    }

    public onTryTrigger(event: MouseEvent): void {
        if (
            event.clientX >= readData(this.boundingBox.x) &&
            event.clientX < readData(this.boundingBox.x) + readData(this.boundingBox.width) &&
            event.clientY >= readData(this.boundingBox.y) &&
            event.clientY < readData(this.boundingBox.y) + readData(this.boundingBox.height)
        ) {
            if (event.type === 'mousedown') {
                this.onMouseDown(event);
            } else if (event.type === 'mouseup') {
                this.onMouseUp(event);
            }
        }
    }
}
