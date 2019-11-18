import { Delegate, Callback } from './common';
export declare class CancellationToken {
    private cancelables;
    private _isCancelled;
    get isCanceled(): boolean;
    constructor(...cancellables: Delegate[]);
    addCancelable(delegate: Delegate): this;
    removeCancelable(delegate: Delegate): this;
    addDisposable(disposable: {
        dispose(): any;
    }): this;
    callIfNotCancelled(action: Delegate): void;
    setTimeout(cb: Delegate, time?: number): void;
    setInterval(cb: Delegate, time: number): void;
    requestAnimationFrame(cb: Callback<number>): void;
    animationLoop(cb: Callback<number>): void;
    throwIfCancelled(msg: string): void;
    chain(target: CancellationToken, twoWays?: boolean): CancellationToken;
    registerDomEvent(eventEmitter: HTMLElement | Document, event: string, callback: (e: Event) => void): this;
    cancel(): void;
}
//# sourceMappingURL=cancellation_token.d.ts.map