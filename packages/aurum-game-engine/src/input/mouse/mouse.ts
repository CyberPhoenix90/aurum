import { CancellationToken, DataSource } from 'aurumjs';

export enum MouseButtons {
    LEFT = 0,
    RIGHT = 2,
    MIDDLE = 3
}

class AurumMouse {
    private heldDownButtons: { [key: number]: boolean };
    private lastPositionX: number;
    private lastPositionY: number;
    private cancellationToken: CancellationToken;
    public readonly mouseDown: DataSource<MouseEvent>;
    public readonly mouseUp: DataSource<MouseEvent>;
    public readonly mouseMove: DataSource<MouseEvent>;
    public readonly mouseScroll: DataSource<WheelEvent>;

    constructor() {
        this.cancellationToken = new CancellationToken();
        this.heldDownButtons = {};

        this.cancellationToken.registerDomEvent(document, 'mousemove', (e: any) => {
            this.prepareEvent(e);
            this.lastPositionX = (e as MouseEvent).clientX;
            this.lastPositionY = (e as MouseEvent).clientY;

            this.mouseMove.update(e);
        });
        this.cancellationToken.registerDomEvent(document, 'mousedown', (e: any) => {
            this.prepareEvent(e);
            this.heldDownButtons[(e as MouseEvent).button] = true;
            this.mouseDown.update(e);
        });
        this.cancellationToken.registerDomEvent(document, 'mouseup', (e: any) => {
            this.prepareEvent(e);
            this.heldDownButtons[(e as MouseEvent).button] = false;
            this.mouseUp.update(e);
        });
        this.cancellationToken.registerDomEvent(document, 'wheel', (e: any) => {
            this.prepareEvent(e);
            this.mouseScroll.update(e);
        });
    }

    public getMouseX(): number {
        return this.lastPositionX;
    }

    public getMouseY(): number {
        return this.lastPositionY;
    }

    public isButtonDown(key: MouseButtons): boolean {
        return this.heldDownButtons[key];
    }

    public dispose(): void {
        this.cancellationToken.cancel();
    }

    private prepareEvent(e: MouseEvent): void {
        //@ts-ignored
        e.propagationStopped = false;
        e.stopPropagation = () => {
            //@ts-ignored
            e.propagationStopped = true;
        };
        e.stopImmediatePropagation = () => {
            //@ts-ignored
            e.propagationStopped = true;
        };
    }
}

export const aurumMouse: AurumMouse = new AurumMouse();
