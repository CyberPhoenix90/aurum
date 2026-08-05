import { CancellationToken } from '../utilities/cancellation_token.js';
import { Callback } from './common.js';

/**
 * @internal
 */
export type EventCallback<T> = (data: T) => void;

/**
 * Event emitter is at the core of aurums stream system. It's a basic pub sub style typesafe event system optimized for high update throughput
 */
export class EventEmitter<T> {
    private static id: number = 0;
    private isFiring: boolean;
    private onAfterFire: Array<() => void>;

    private static leakWarningThreshold: number;

    /**
     * Set a number of subscriptions that any event can have at most before emitting warnings. The subscriptions will continue working but the warnings can be used
     * to track potential subscription memory leaks
     */
    public static setSubscriptionLeakWarningThreshold(limit: number) {
        EventEmitter.leakWarningThreshold = limit;
    }

    /**
     * returns the count of subscriptions both one time and regular
     */
    public get subscriptions(): number {
        return this.subscribeChannel.size + this.subscribeOnceChannel.length;
    }

    private subscribeChannel: Map<number, Callback<T>>;
    private subscribeOnceChannel: Callback<T>[];
    private subscribeCache: Callback<T>[];

    constructor() {
        this.subscribeChannel = new Map();
        this.subscribeOnceChannel = [];
        this.onAfterFire = [];
    }

    public static fromAsyncIterator<T>(iterator: AsyncIterableIterator<T>): EventEmitter<T> {
        const event = new EventEmitter<T>();
        (async () => {
            for await (const value of iterator) {
                event.fire(value);
            }
        })();
        return event;
    }

    public toAsyncIterator(errorChannel: EventEmitter<Error>, cancellationToken?: CancellationToken): AsyncIterableIterator<T> {
        const buffer = new Array<{ value?: IteratorResult<T>; error?: Error }>();
        let sink: (arg: { value?: IteratorResult<T>; error?: Error }) => void;

        errorChannel?.subscribe((error) => {
            if (sink) {
                sink({ error });
                sink = undefined;
            } else {
                buffer.push({ error });
            }
        }, cancellationToken);

        cancellationToken?.addCancellable(() => {
            if (sink) {
                sink({
                    value: {
                        done: true,
                        value: undefined
                    }
                });
            } else {
                buffer.push({
                    value: {
                        done: true,
                        value: undefined
                    }
                });
            }
        });

        this.subscribe((value) => {
            if (sink) {
                sink({
                    value: {
                        done: false,
                        value
                    }
                });
                sink = undefined;
            } else {
                buffer.push({
                    value: {
                        done: false,
                        value
                    }
                });
            }
        }, cancellationToken);

        return {
            [Symbol.asyncIterator](): AsyncIterableIterator<T> {
                return this;
            },
            async next(): Promise<IteratorResult<T>> {
                if (buffer.length > 0) {
                    const next = buffer.shift();
                    if (next.error) {
                        throw next.error;
                    } else {
                        return next.value;
                    }
                }

                return new Promise<IteratorResult<T>>((resolve, reject) => {
                    sink = (value) => {
                        if (value.error) {
                            reject(value.error);
                        } else {
                            resolve(value.value);
                        }
                    };
                });
            }
        };
    }

    /**
     * Subscribe to the event. The callback will be called whenever the event fires an update
     */
    public subscribe(callback: EventCallback<T>, cancellationToken?: CancellationToken): void {
        this.createSubscription(callback, cancellationToken);
        if (EventEmitter.leakWarningThreshold && this.subscribeChannel.size > EventEmitter.leakWarningThreshold) {
            console.warn(`Observable has ${this.subscribeChannel.size} subscriptions. This could potentially indicate a memory leak`);
        }
    }

    /**
     * Subscribe to the event. The callback will be called when the event next fires an update after which the subscription is cancelled
     */
    public subscribeOnce(callback: Callback<T>, cancellationToken?: CancellationToken): void {
        this.createSubscriptionOnce(callback, cancellationToken);

        if (EventEmitter.leakWarningThreshold && this.subscribeOnceChannel.length > EventEmitter.leakWarningThreshold) {
            console.warn(`Observable has ${this.subscribeOnceChannel.length} one time subscriptions. This could potentially indicate a memory leak`);
        }
    }

    /**
     * Whether the event has any subscriptions
     */
    public hasSubscriptions(): boolean {
        return this.subscriptions > 0;
    }

    /**
     * Removes all currently active subscriptions. If called in the callback of a subscription will be deferred until after the fire event finished
     */
    public cancelAll(): void {
        if (!this.isFiring) {
            this.subscribeChannel.clear();
            this.subscribeCache = undefined;
            this.subscribeOnceChannel.length = 0;
        } else {
            this.onAfterFire.push(() => {
                this.subscribeCache = undefined;
                this.subscribeChannel.clear();
                this.subscribeOnceChannel.length = 0;
            });
        }
    }

    private afterFire() {
        if (this.onAfterFire.length > 0) {
            this.onAfterFire.forEach((cb) => cb());
            this.onAfterFire.length = 0;
        }
    }

    /**
     * Publishes a new value all subscribers will be called
     * Errors in the callbacks are caught and deferred until after fire finishes before throwing to avoid interrupting the propagation of the event
     * to all subscribers simply because of one faulty subscriber
     */
    public fire(data?: T): void {
        const length = this.subscribeChannel.size;
        const lengthOnce = this.subscribeOnceChannel.length;
        if (length === 0 && lengthOnce === 0) {
            //Cut some overhead in the case nothing is listening
            return;
        }

        this.isFiring = true;
        let error = undefined;

        if (this.subscribeCache === undefined) {
            this.subscribeCache = Array.from(this.subscribeChannel.values());
        }

        for (let i = 0; i < length; i++) {
            try {
                this.subscribeCache[i](data);
            } catch (e) {
                error = e;
                console.error(e);
            }
        }

        if (this.subscribeOnceChannel.length > 0) {
            for (let i = 0; i < lengthOnce; i++) {
                try {
                    this.subscribeOnceChannel[i](data);
                } catch (e) {
                    error = e;
                    console.error(e);
                }
            }
            this.subscribeOnceChannel.length = 0;
        }

        this.isFiring = false;
        this.afterFire();

        if (error) {
            throw error;
        }
    }

    private createSubscriptionOnce(callback: EventCallback<T>, cancellationToken?: CancellationToken): void {
        if (cancellationToken !== undefined) {
            cancellationToken.addCancellable(() => this.cancelOnce(callback));
        }
        if (this.isFiring) {
            this.onAfterFire.push(() => this.subscribeOnceChannel.push(callback));
        } else {
            this.subscribeOnceChannel.push(callback);
        }
    }

    private createSubscription(callback: EventCallback<T>, cancellationToken?: CancellationToken): void {
        const id = EventEmitter.id++;

        if (cancellationToken !== undefined) {
            cancellationToken.addCancellable(() => this.cancel(id));
        }
        if (this.isFiring) {
            this.onAfterFire.push(() => {
                if (this.subscribeCache === undefined) {
                    this.subscribeCache = Array.from(this.subscribeChannel.values());
                }
                this.subscribeCache.push(callback);
                this.subscribeChannel.set(id, callback);
            });
        } else {
            if (this.subscribeCache === undefined) {
                this.subscribeCache = Array.from(this.subscribeChannel.values());
            }
            this.subscribeCache.push(callback);
            this.subscribeChannel.set(id, callback);
        }
    }

    private cancelOnce(subscription: Callback<T>): void {
        if (!this.isFiring) {
            let index: number = this.subscribeOnceChannel.indexOf(subscription);
            if (index >= 0) {
                this.subscribeOnceChannel.splice(index, 1);
            } else {
                this.onAfterFire.push(() => this.cancelOnce(subscription));
            }
        }
    }

    private cancel(id: number): void {
        if (!this.isFiring) {
            this.subscribeCache = undefined;
            this.subscribeChannel.delete(id);
        } else {
            this.onAfterFire.push(() => {
                this.subscribeCache = undefined;
                this.cancel(id);
            });
        }
    }
}
