import { DataSource, CancellationToken, dsUnique } from 'aurumjs';
import { Vector2D } from '../../math/vectors/vector2d';
import { onBeforeRender } from '../../core/stage';
import { PointLike } from 'aurum-layout-engine';

export class Gamepadsettings {
    /**
     * How many percent at least the joystick must be moved until it registers.
     * This is essential because joysticks are inaccurate and sometimes up to 15% will be reigstered when the joystick is actually at rest
     */
    joystickDeadzone?: number;
    /**
     * Multiplies the value of the analog stick. This can be useful because on older or cheaper joysticks the maximum value never actually reaches 1.0
     * The value is capped to 1.0 so you don't have to worry about correcting the maximum value
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
    public leftJoystickState: DataSource<PointLike>;
    public rightJoystickState: DataSource<PointLike>;

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
        this.settings = settings;

        for (const button of Object.keys(GamepadButtons)) {
            this.buttonState[button] = new DataSource(false);
            this.buttonAnalogueState[button] = new DataSource(0);
        }

        this.leftJoystickState = new DataSource({ x: 0, y: 0 }).transform(dsUnique((a, b) => a.x === b.x && a.y === b.y));
        this.rightJoystickState = new DataSource({ x: 0, y: 0 }).transform(dsUnique((a, b) => a.x === b.x && a.y === b.y));

        this.index = index;
        this.cancelationToken = new CancellationToken();

        onBeforeRender.subscribe(() => {
            this.fireEvents();
        }, this.cancelationToken);

        this.cancelationToken.addCancelable(() => {
            this.leftJoystickState.cancelAll();
            this.rightJoystickState.cancelAll();
            for (const buttonState of Object.values(this.buttonState)) {
                buttonState.cancelAll();
            }
            for (const buttonAnalogueState of Object.values(this.buttonAnalogueState)) {
                buttonAnalogueState.cancelAll();
            }
        });
    }

    private fireEvents(): void {
        if (!this.gamepad) {
            return;
        }

        for (const buttonIndex of Object.keys(this.buttonState)) {
            const buttonIndexNumber: number = parseInt(buttonIndex, 10);
            const buttonState: DataSource<boolean> = this.buttonState[buttonIndexNumber];
            const buttonAnalogueState: DataSource<number> = this.buttonAnalogueState[buttonIndexNumber];
            buttonState.update(this.getButtonState(buttonIndexNumber));
            buttonAnalogueState.update(this.getButtonValue(buttonIndexNumber));
        }

        this.leftJoystickState.update(this.getJoystickValue(0));
        this.rightJoystickState.update(this.getJoystickValue(1));
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

    private motionVector: Vector2D = new Vector2D();
    public getJoystickValue(joystickIndex: number): { x: number; y: number } {
        if (!this.gamepad) {
            throw new Error('Gamepad is not connected');
        }

        if (joystickIndex * 2 + 1 >= this.gamepad.axes.length) {
            throw new Error(`Gamepad joystick index overflow joystick index ${joystickIndex} ask but only ${this.joystickCount} joysticks available`);
        }

        const x: number = this.gamepad.axes[joystickIndex * 2];
        const y: number = this.gamepad.axes[joystickIndex * 2 + 1];
        const motion: Vector2D = this.motionVector;
        motion.x = x;
        motion.y = y;

        if (this.settings.joystickDeadzone === undefined) {
            throw new Error('invalid state');
        }

        if (this.settings.joystickActuationMultiplier) {
            motion.mul(this.settings.joystickActuationMultiplier);
            motion.clamp(0, 1);
        }

        return motion.lengthSquared() > this.settings.joystickDeadzone ** 2 ? { x: motion.x, y: motion.y } : { x: 0, y: 0 };
    }

    public dispose() {
        this.cancelationToken.cancel();
    }
}
