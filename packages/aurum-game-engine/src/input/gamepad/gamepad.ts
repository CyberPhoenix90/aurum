import { ReactivePointLike } from 'aurum-layout-engine';
import { CancellationToken, DataSource } from 'aurumjs';
import { onBeforeRender } from '../../core/stage';
import { clamp } from '../../utilities/math_utils';

export class Gamepadsettings {
    /**
     * How many percent at least the joystick must be moved until it registers.
     * This is essential because joysticks are inaccurate and sometimes up to 15% will be reigstered when the joystick is actually at rest
     * Default: 0.2
     */
    joystickDeadzone?: number;
    /**
     * Multiplies the value of the analog stick. This can be useful because on older or cheaper joysticks the maximum value may never actually reach 1.0 in some directions.
     * The value is capped to 1.0 so you don't have to worry about correcting the maximum value
     * Default: 1.1
     */
    joystickActuationMultiplier?: number;
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
    public buttonState: Record<GamepadButtons, DataSource<boolean>>;
    public buttonAnalogueState: Record<GamepadButtons, DataSource<number>>;
    public joystickState: ReactivePointLike[];

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
        settings.joystickDeadzone = settings.joystickDeadzone ?? 0.2;
        settings.joystickActuationMultiplier = settings.joystickActuationMultiplier ?? 1.1;

        this.settings = settings;

        for (const button of Object.keys(GamepadButtons)) {
            this.buttonState[button] = new DataSource(false);
            this.buttonAnalogueState[button] = new DataSource(0);
        }

        this.joystickState = [];
        for (let i = 0; i < this.joystickCount; i++) {
            this.joystickState.push({ x: new DataSource(0), y: new DataSource(0) });
        }

        this.index = index;
        this.cancelationToken = new CancellationToken();

        onBeforeRender.subscribe(this.fireEvents.bind(this), this.cancelationToken);
    }

    private fireEvents(): void {
        if (!this.gamepad || !this.gamepad.connected) {
            return;
        }

        for (const buttonIndex of Object.keys(this.buttonState)) {
            const buttonIndexNumber: number = parseInt(buttonIndex, 10);
            const buttonState: DataSource<boolean> = this.buttonState[buttonIndexNumber];
            const buttonAnalogueState: DataSource<number> = this.buttonAnalogueState[buttonIndexNumber];
            buttonState.update(this.getButtonState(buttonIndexNumber));
            buttonAnalogueState.update(this.getButtonValue(buttonIndexNumber));
        }

        for (let i = 0; i < this.joystickCount; i++) {
            this.updateJoystickValue(i, this.joystickState[i]);
        }
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

    private updateJoystickValue(joystickIndex: number, data: ReactivePointLike): void {
        if (!this.gamepad) {
            throw new Error('Gamepad is not connected');
        }

        if (joystickIndex * 2 + 1 >= this.gamepad.axes.length) {
            throw new Error(`Gamepad joystick index overflow joystick index ${joystickIndex} ask but only ${this.joystickCount} joysticks available`);
        }

        let x: number = clamp(this.gamepad.axes[joystickIndex * 2] * this.settings.joystickActuationMultiplier, 0, 1);
        let y: number = clamp(this.gamepad.axes[joystickIndex * 2 + 1] * this.settings.joystickActuationMultiplier, 0, 1);

        if (this.settings.joystickDeadzone === undefined) {
            throw new Error('invalid state');
        }

        if (x < this.settings.joystickDeadzone) {
            x = 0;
        }

        if (y < this.settings.joystickDeadzone) {
            y = 0;
        }

        if (data.x.value !== x) {
            data.x.update(x);
        }

        if (data.y.value !== y) {
            data.y.update(y);
        }
    }

    public dispose() {
        this.cancelationToken.cancel();
    }
}
