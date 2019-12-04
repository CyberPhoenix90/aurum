import { Delegate, Callback } from './common';
import { LinkedList } from './linkedlist/linked_list';

export class CancellationToken {
	private cancelables: LinkedList<Delegate>;
	private _isCancelled: boolean;

	public get isCanceled(): boolean {
		return this._isCancelled;
	}

	constructor(...cancellables: Delegate[]) {
		this.cancelables = new LinkedList(cancellables);
		this._isCancelled = false;
	}

	/**
	 * Attaches a new cancelable to this token
	 * @param delegate
	 */
	public addCancelable(delegate: Delegate): this {
		this.throwIfCancelled('attempting to add cancellable to token that is already cancelled');

		this.cancelables.append(delegate);

		if (this.cancelables.length > 200) {
			console.log('potential memory leak: cancellation token has over 200 clean up calls');
		}

		return this;
	}

	public removeCancelable(delegate: Delegate): this {
		this.throwIfCancelled('attempting to remove cancellable from token that is already cancelled');

		this.cancelables.remove(delegate);

		return this;
	}

	public addDisposable(disposable: { dispose(): any }): this {
		this.addCancelable(() => disposable.dispose());

		return this;
	}

	public callIfNotCancelled(action: Delegate): void {
		if (!this.isCanceled) {
			action();
		}
	}

	public setTimeout(cb: Delegate, time: number = 0): void {
		const id = setTimeout(() => {
			this.removeCancelable(cancelable);
			cb();
		}, time);
		const cancelable = () => clearTimeout(id);
		this.addCancelable(cancelable);
	}

	public setInterval(cb: Delegate, time: number): void {
		const id = setInterval(cb, time);
		this.addCancelable(() => clearInterval(id));
	}

	public requestAnimationFrame(cb: Callback<number>): void {
		const id: number = requestAnimationFrame(cb);
		this.addCancelable(() => cancelAnimationFrame(id));
	}

	public animationLoop(cb: Callback<number>): void {
		let id: number = requestAnimationFrame(function f(time: number) {
			cb(time);
			id = requestAnimationFrame(f);
		});

		this.addCancelable(() => cancelAnimationFrame(id));
	}

	public throwIfCancelled(msg: string): void {
		if (this.isCanceled) {
			throw new Error(msg || 'cancellation token is cancelled');
		}
	}

	public chain(target: CancellationToken, twoWays: boolean = false): CancellationToken {
		if (twoWays) {
			target.chain(this, false);
		}

		this.addCancelable(() => target.cancel());

		return this;
	}

	/**
	 * Registers an event using addEventListener and if you cancel the token the event will be canceled as well
	 */
	public registerDomEvent(eventEmitter: HTMLElement | Document, event: string, callback: (e: Event) => void): this {
		(eventEmitter as HTMLElement).addEventListener(event, callback);
		this.addCancelable(() => eventEmitter.removeEventListener(event, callback));

		return this;
	}

	/**
	 * Cancels everything attached to this token
	 */
	public cancel(): void {
		if (this.isCanceled) {
			return;
		}
		this._isCancelled = true;
		this.cancelables.forEach((c) => c());
		this.cancelables = undefined;
	}
}
