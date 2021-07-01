import { CancellationToken } from '../utilities/cancellation_token';
import { Callback } from './common';

/**
 * @internal
 */
export interface EventSubscriptionFacade {
    cancel(): void;
}

/**
 * @internal
 */
export type EventCallback<T> = (data: T) => void;

interface EventSubscription<T> {
    callback: EventCallback<T>;
}

/**
 * Event emitter is at the core of aurums stream system. It's a basic pub sub style typesafe event system optimized for high update throughput
 */
export class EventEmitter<T> {
    private isFiring: boolean;
    private onAfterFire: Array<() => void>;
    /**
     * Callback that if set is called when all subscriptions are removed
     */
    public onEmpty: Callback<void>;

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
        return this.subscribeChannel.length + this.subscribeOnceChannel.length;
    }

    private subscribeChannel: EventSubscription<T>[];
    private subscribeOnceChannel: EventSubscription<T>[];

    constructor() {
        this.subscribeChannel = [];
        this.subscribeOnceChannel = [];
        this.onAfterFire = [];
    }

    /**
     * Subscribe to the event. The callback will be called whenever the event fires an update
     */
    public subscribe(callback: EventCallback<T>, cancellationToken?: CancellationToken): EventSubscriptionFacade {
        const { facade } = this.createSubscription(callback, this.subscribeChannel, cancellationToken);
        if (EventEmitter.leakWarningThreshold && this.subscribeChannel.length > EventEmitter.leakWarningThreshold) {
            console.warn(`Observable has ${this.subscribeChannel.length} subscriptions. This could potentially indicate a memory leak`);
        }

        return facade;
    }

    /**
     * Subscribe to the event. The callback will be called when the event next fires an update after which the subscription is cancelled
     */
    public subscribeOnce(callback: import('./common').Callback<T>, cancellationToken?: CancellationToken) {
        const { facade } = this.createSubscription(callback, this.subscribeOnceChannel, cancellationToken);

        if (EventEmitter.leakWarningThreshold && this.subscribeOnceChannel.length > EventEmitter.leakWarningThreshold) {
            console.warn(`Observable has ${this.subscribeOnceChannel.length} one time subscriptions. This could potentially indicate a memory leak`);
        }

        return facade;
    }

    /**
     * Whether the event has any subscriptions
     */
    public hasSubscriptions(): boolean {
        return this.subscriptions > 0;
    }

    /**
     * Removes all currently active subscriptions. If called in the callback of a subscription will be defered until after the fire event finished
     */
    public cancelAll(): void {
        if (!this.isFiring) {
            this.subscribeChannel.length = 0;
            this.subscribeOnceChannel.length = 0;
            this.onEmpty?.();
        } else {
            this.onAfterFire.push(() => {
                this.subscribeChannel.length = 0;
                this.subscribeOnceChannel.length = 0;
                this.onEmpty?.();
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
        const length = this.subscribeChannel.length;
        const lengthOnce = this.subscribeChannel.length;
        if (length === 0 && lengthOnce === 0) {
            //Cut some overhead in the case nothing is listening
            return;
        }

        this.isFiring = true;
        let error = undefined;

        for (let i = 0; i < length; i++) {
            try {
                this.subscribeChannel[i].callback(data);
            } catch (e) {
                error = e;
                console.error(e);
            }
        }

        if (this.subscribeOnceChannel.length > 0) {
            for (let i = 0; i < lengthOnce; i++) {
                try {
                    this.subscribeOnceChannel[i].callback(data);
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

    private createSubscription(
        callback: EventCallback<T>,
        channel: EventSubscription<T>[],
        cancellationToken?: CancellationToken
    ): { subscription: EventSubscription<T>; facade: EventSubscriptionFacade } {
        const that: this = this;

        const subscription: EventSubscription<T> = {
            callback
        };

        const facade: EventSubscriptionFacade = {
            cancel() {
                that.cancel(subscription, channel);
            }
        };

        if (cancellationToken !== undefined) {
            cancellationToken.addCancelable(() => that.cancel(subscription, channel));
        }
        if (this.isFiring) {
            this.onAfterFire.push(() => channel.push(subscription));
        } else {
            channel.push(subscription);
        }

        return { subscription, facade };
    }

    private cancel(subscription: EventSubscription<T>, channel: EventSubscription<T>[]): void {
        let index: number = channel.indexOf(subscription);
        if (index >= 0) {
            if (!this.isFiring) {
                channel.splice(index, 1);
                if (!this.hasSubscriptions()) {
                    this.onEmpty?.();
                }
            } else {
                this.onAfterFire.push(() => this.cancel(subscription, channel));
            }
        }
    }
}
