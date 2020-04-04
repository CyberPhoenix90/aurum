import { LinkedList } from './linkedlist/linked_list';
export class CancellationToken {
    constructor(...cancellables) {
        this.cancelables = new LinkedList(cancellables);
        this._isCancelled = false;
    }
    get isCanceled() {
        return this._isCancelled;
    }
    /**
     * Attaches a new cancelable to this token
     * @param delegate
     */
    addCancelable(delegate) {
        this.throwIfCancelled('attempting to add cancellable to token that is already cancelled');
        this.cancelables.append(delegate);
        if (this.cancelables.length > 200) {
            console.log('potential memory leak: cancellation token has over 200 clean up calls');
        }
        return this;
    }
    removeCancelable(delegate) {
        this.throwIfCancelled('attempting to remove cancellable from token that is already cancelled');
        this.cancelables.remove(delegate);
        return this;
    }
    addDisposable(disposable) {
        this.addCancelable(() => disposable.dispose());
        return this;
    }
    callIfNotCancelled(action) {
        if (!this.isCanceled) {
            action();
        }
    }
    setTimeout(cb, time = 0) {
        const id = setTimeout(() => {
            this.removeCancelable(cancelable);
            cb();
        }, time);
        const cancelable = () => clearTimeout(id);
        this.addCancelable(cancelable);
    }
    setInterval(cb, time) {
        const id = setInterval(cb, time);
        this.addCancelable(() => clearInterval(id));
    }
    requestAnimationFrame(cb) {
        const id = requestAnimationFrame(() => {
            this.removeCancelable(cancelable);
            cb();
        });
        const cancelable = () => cancelAnimationFrame(id);
        this.addCancelable(cancelable);
    }
    animationLoop(cb) {
        let id = requestAnimationFrame(function f(time) {
            cb(time);
            id = requestAnimationFrame(f);
        });
        this.addCancelable(() => cancelAnimationFrame(id));
    }
    throwIfCancelled(msg) {
        if (this.isCanceled) {
            throw new Error(msg || 'cancellation token is cancelled');
        }
    }
    chain(target, twoWays = false) {
        if (twoWays) {
            target.chain(this, false);
        }
        this.addCancelable(() => target.cancel());
        return this;
    }
    /**
     * Registers an event using addEventListener and if you cancel the token the event will be canceled as well
     */
    registerDomEvent(eventEmitter, event, callback) {
        eventEmitter.addEventListener(event, callback);
        this.addCancelable(() => eventEmitter.removeEventListener(event, callback));
        return this;
    }
    /**
     * Cancels everything attached to this token
     */
    cancel() {
        if (this.isCanceled) {
            return;
        }
        this._isCancelled = true;
        this.cancelables.forEach((c) => c());
        this.cancelables = undefined;
    }
}
//# sourceMappingURL=cancellation_token.js.map