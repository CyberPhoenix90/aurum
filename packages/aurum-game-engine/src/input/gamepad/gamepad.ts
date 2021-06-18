import { DataSource, CancellationToken } from 'aurumjs';
import { Vector2D } from '../../math/vectors/vector2d';
import { onBeforeRender } from '../../core/stage';

export class Gamepadsettings {
	/**
	 * How many percent at least the joystick must be moved until it registers.
	 * This is essential because joysticks are inaccurate and sometimes up to 15% will be reigstered when the joystick is actually at rest
	 */
	joystickDeadzone?: number;
}

export enum GamepadButtons {
	A = 0,
	B = 1,
	X = 2,
	Y = 3,
	L1 = 4,
	R1 = 5,
	L2 = 6,
	R2 = 7,
	SELECT = 8,
	START = 9,
	JOYSTICK_1_DOWN = 10,
	JOYSTICK_2_DOWN = 11,
	D_PAD_UP = 12,
	D_PAD_DOWN = 13,
	D_PAD_LEFT = 14,
	D_PAD_RIGHT = 15
}

export class AurumGamepad {
	public readonly settings: Readonly<Gamepadsettings>;
	private listeners: Array<() => void>;

	public get connected(): boolean {
		if (!this.gamepad) {
			return false;
		} else {
			return this.gamepad.connected;
		}
	}

	public get joystickCount(): number {
		if (this.gamepad) {
			return this.gamepad.axes.length / 2;
		} else {
			return undefined;
		}
	}

	private get gamepad(): Gamepad | undefined {
		return navigator.getGamepads()[this.index];
	}

	private cancelationToken: CancellationToken;
	private index: number;

	constructor(index: number, settings: Gamepadsettings = {}) {
		settings.joystickDeadzone = settings.joystickDeadzone || 0.2;
		this.settings = settings;

		this.index = index;
		this.cancelationToken = new CancellationToken();

		onBeforeRender.subscribe(() => {
			this.fireEvents();
		}, this.cancelationToken);

		this.listeners = [];
		this.cancelationToken.addCancelable(() => (this.listeners.length = 0));
	}

	public listenButtonState(index: GamepadButtons): DataSource<boolean> {
		const result = new DataSource<boolean>();

		this.listeners.push(() => {
			const value = this.getButtonState(index);
			if (result.value !== value) {
				result.update(value);
			}
		});

		return result;
	}

	/**
	 * Used for analogue buttons
	 */
	public listenButtonValue(index: GamepadButtons): DataSource<number> {
		const result = new DataSource<number>();

		this.listeners.push(() => {
			const value = this.getButtonValue(index);
			if (result.value !== value) {
				result.update(value);
			}
		});

		return result;
	}

	public listenJoystick(index: number): DataSource<{ x: number; y: number }> {
		const result = new DataSource<{ x: number; y: number }>();

		this.listeners.push(() => {
			const value = this.getJoystickValue(index);
			if (result.value?.x !== value.x && result.value?.y !== value.y) {
				result.update(value);
			}
		});

		return result;
	}

	public getButtonState(buttonIndex: GamepadButtons): boolean {
		if (this.gamepad) {
			return this.gamepad.buttons[buttonIndex].pressed;
		} else {
			throw new Error('Gamepad is not connected');
		}
	}

	public getButtonValue(buttonIndex: GamepadButtons): number {
		if (this.gamepad) {
			return this.gamepad.buttons[buttonIndex].value;
		} else {
			throw new Error('Gamepad is not connected');
		}
	}

	public getJoystickValue(joystickIndex: number): { x: number; y: number } {
		if (!this.gamepad) {
			throw new Error('Gamepad is not connected');
		}

		if (joystickIndex * 2 + 1 >= this.gamepad.axes.length) {
			throw new Error(`Gamepad joystick index overflow joystick index ${joystickIndex} ask but only ${this.joystickCount} joysticks available`);
		}

		const x: number = this.gamepad.axes[joystickIndex * 2];
		const y: number = this.gamepad.axes[joystickIndex * 2 + 1];
		const motion: Vector2D = new Vector2D(x, y);

		if (this.settings.joystickDeadzone === undefined) {
			throw new Error('invalid state');
		}

		return motion.length() > this.settings.joystickDeadzone ? motion : Vector2D.zero();
	}

	public dispose() {
		this.cancelationToken.cancel();
	}

	private fireEvents(): void {
		if (!this.gamepad) {
			return;
		}

		for (const listener of this.listeners) {
			listener();
		}
	}
}
