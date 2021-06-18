import { CancellationToken, DataSource, dsFilter } from 'aurumjs';

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
	private mouseDown: DataSource<MouseEvent>[];
	private mouseUp: DataSource<MouseEvent>[];
	private mouseMove: DataSource<MouseEvent>[];
	private mouseScroll: DataSource<WheelEvent>[];

	constructor() {
		this.cancellationToken = new CancellationToken();
		this.heldDownButtons = {};
		this.mouseDown = [];
		this.mouseUp = [];
		this.mouseMove = [];
		this.mouseScroll = [];

		this.cancellationToken.registerDomEvent(document, 'mousemove', (e: any) => {
			this.prepareEvent(e);
			this.lastPositionX = (e as MouseEvent).clientX;
			this.lastPositionY = (e as MouseEvent).clientY;
			this.mouseMove.forEach((mm) => mm.update(e));
		});
		this.cancellationToken.registerDomEvent(document, 'mousedown', (e: any) => {
			this.prepareEvent(e);
			this.heldDownButtons[(e as MouseEvent).button] = true;
			this.mouseDown.forEach((md) => md.update(e));
		});
		this.cancellationToken.registerDomEvent(document, 'mouseup', (e: any) => {
			this.prepareEvent(e);
			this.heldDownButtons[(e as MouseEvent).button] = false;
			this.mouseUp.forEach((mu) => mu.update(e));
		});
		this.cancellationToken.registerDomEvent(document, 'wheel', (e: any) => {
			this.prepareEvent(e);
			this.mouseScroll.forEach((ms) => ms.update(e));
		});
	}

	public listenMouseDown(key: MouseButtons, cancellationToken?: CancellationToken): DataSource<MouseEvent> {
		const result = new DataSource<MouseEvent>();

		this.mouseDown.unshift(result);

		if (cancellationToken) {
			cancellationToken.addCancelable(() => {
				this.mouseDown.splice(this.mouseDown.indexOf(result), 1);
			});
		}

		return result.transform(dsFilter((e) => e.button === key));
	}

	public listenMouseMove(cancellationToken?: CancellationToken): DataSource<MouseEvent> {
		const result = new DataSource<MouseEvent>();

		this.mouseMove.unshift(result);

		if (cancellationToken) {
			cancellationToken.addCancelable(() => {
				this.mouseMove.splice(this.mouseMove.indexOf(result), 1);
			});
		}

		return result;
	}

	public listenMouseScroll(cancellationToken?: CancellationToken): DataSource<WheelEvent> {
		const result = new DataSource<WheelEvent>();

		this.mouseScroll.unshift(result);

		if (cancellationToken) {
			cancellationToken.addCancelable(() => {
				this.mouseScroll.splice(this.mouseScroll.indexOf(result), 1);
			});
		}

		return result;
	}

	public listenMouseUp(key: MouseButtons, cancellationToken?: CancellationToken): DataSource<MouseEvent> {
		const result = new DataSource<MouseEvent>();

		this.mouseUp.unshift(result);

		if (cancellationToken) {
			cancellationToken.addCancelable(() => {
				this.mouseUp.splice(this.mouseUp.indexOf(result), 1);
			});
		}

		return result.transform(dsFilter((e) => e.button === key));
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
