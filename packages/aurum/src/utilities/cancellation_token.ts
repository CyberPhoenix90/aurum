import { Delegate, Callback } from './common.js';

export interface ReadonlyCancellationToken {
    readonly isCancelled: boolean;

    hasCancellables(): boolean;
}

export class CancellationToken {
    private cancelables: Delegate[];
    private _isCancelled: boolean;

    public get isCancelled(): boolean {
        return this._isCancelled;
    }

    constructor(...cancellables: Delegate[]) {
        this.cancelables = cancellables ?? [];
        this._isCancelled = false;
    }

    public static expired = new CancellationToken();
    public static forever = new CancellationToken();

    public static fromPromise<T>(promise: Promise<T>): CancellationToken {
        const token = new CancellationToken();
        promise.then(() => {
            token.cancel();
        });
        return token;
    }

    public static fromTimeout(time: number): CancellationToken {
        const token = new CancellationToken();
        token.setTimeout(() => token.cancel(), time);
        return token;
    }

    public hasCancellables(): boolean {
        return this.cancelables.length > 0;
    }

    /**
     * Attaches a new cancelable to this token
     * @param delegate
     */
    public addCancellable(delegate: Delegate | CancellationToken): this {
        this.throwIfCancelled('attempting to add cancellable to token that is already cancelled');

        if (delegate instanceof CancellationToken) {
            this.addCancellable(() => delegate.cancel());
            return this;
        }

        this.cancelables.push(delegate);

        if (this.cancelables.length === 200) {
            console.log('potential memory leak: cancellation token has over 200 clean up calls');
        }

        return this;
    }

    public removeCancellable(delegate: Delegate): this {
        this.throwIfCancelled('attempting to remove cancellable from token that is already cancelled');

        const index = this.cancelables.indexOf(delegate);
        if (index !== -1) {
            this.cancelables.splice(index, 1);
        }

        return this;
    }

    public setTimeout(cb: Delegate, time: number = 0): void {
        const id = setTimeout(() => {
            this.removeCancellable(cancelable);
            cb();
        }, time);
        const cancelable = () => clearTimeout(id);
        this.addCancellable(cancelable);
    }

    public setInterval(cb: Delegate, time: number): void {
        const id = setInterval(cb, time);
        this.addCancellable(() => clearInterval(id));
    }

    public requestAnimationFrame(cb: Callback<number>): void {
        const id: number = requestAnimationFrame(() => {
            this.removeCancellable(cancelable);
            cb();
        });
        const cancelable = () => cancelAnimationFrame(id);
        this.addCancellable(cancelable);
    }

    public animationLoop(cb: Callback<number>): void {
        registerAnimationLoop(cb, this);
    }

    public throwIfCancelled(msg: string): void {
        if (this.isCancelled) {
            throw new Error(msg || 'cancellation token is cancelled');
        }
    }

    /**
     *  Combines multiple tokens into one. If any of the tokens are cancelled the returned token will be cancelled as well
     */
    public or(...token: CancellationToken[]): CancellationToken {
        if (token.every((t) => t === CancellationToken.forever || t == undefined)) {
            return this;
        }

        if (token.some((t) => t.isCancelled)) {
            return CancellationToken.expired;
        }

        token = token.filter(Boolean);

        const orToken = new CancellationToken();
        this.addCancellable(() => orToken.cancel());
        for (const t of token) {
            t.addCancellable(() => orToken.cancel());
        }

        return orToken;
    }

    /**
     *  Combines multiple tokens into one. If all of the tokens are cancelled the returned token will be cancelled as well
     */
    public and(...token: CancellationToken[]): CancellationToken {
        if (token.every((t) => t.isCancelled || t == undefined)) {
            return this;
        }
        if (token.some((t) => t === CancellationToken.forever)) {
            return CancellationToken.forever;
        }

        token = token.filter(Boolean);

        let cancelCount = 0;
        const andToken = new CancellationToken();
        const cancel = () => {
            cancelCount++;
            if (cancelCount === token.length + 1) {
                andToken.cancel();
            }
        };

        this.addCancellable(cancel);
        for (const t of token) {
            t.addCancellable(cancel);
        }

        return andToken;
    }

    /**
     * Registers an event using addEventListener and if you cancel the token the event will be canceled as well
     */
    public registerDomEvent<T extends Event>(
        eventEmitter: {
            addEventListener: (event: string, cb: (e: T) => void) => void;
            removeEventListener: (event: string, cb: (e: T) => void) => void;
        },
        event: string,
        callback: (e: T) => void
    ): this {
        eventEmitter.addEventListener(event, callback);
        this.addCancellable(() => eventEmitter.removeEventListener(event, callback));

        return this;
    }

    /**
     * Registers an event using on and if you cancel the token the event will be canceled using off as well
     */
    public registerEmitterEvent<T>(
        eventEmitter: { on: (event: string, cb: (e: T) => void) => void; off: (event: string, cb: (e: T) => void) => void },
        event: string,
        callback: (e: T) => void
    ): this {
        eventEmitter.on(event, callback);
        this.addCancellable(() => eventEmitter.off(event, callback));

        return this;
    }

    /**
     * Cancels everything attached to this token
     */
    public cancel(): void {
        if (this.isCancelled) {
            return;
        }
        this._isCancelled = true;
        for (const c of this.cancelables) {
            c();
        }
        this.cancelables = undefined;
    }
}

const animationCbs = [];
let looping = false;

export function registerAnimationLoop(callback: (time: number) => void, token: CancellationToken): void {
    animationCbs.push(callback);
    token.addCancellable(() => {
        animationCbs.splice(animationCbs.indexOf(callback), 1);
    });
    if (!looping) {
        looping = true;
        requestAnimationFrame(loop);
    }
}

function loop(time: number): void {
    for (const cb of animationCbs) {
        try {
            cb(time);
        } catch (e) {
            console.error(e);
        }
    }

    if (animationCbs.length === 0) {
        looping = false;
    }

    if (looping) {
        requestAnimationFrame(loop);
    }
}
// Token that is pre-cancelled. Signals that the operation should be cancelled immediately
CancellationToken.expired.cancel();
// Token that is never cancelled. Signals that the operation should never be cancelled or lasts for the whole process lifetime
CancellationToken.forever.addCancellable = () => void 0;
CancellationToken.forever.cancel = () => {
    throw new Error('Cannot cancel forever token');
};
