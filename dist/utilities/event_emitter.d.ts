import { CancellationToken } from '../utilities/cancellation_token';
/**
 * @internal
 */
export interface EventSubscriptionFacade {
    cancel(): void;
}
/**
 * @internal
 */
export declare type EventCallback<T> = (data: T) => void;
/**
 * @internal
 */
export declare class EventEmitter<T> {
    private isFiring;
    private onAfterFire;
    get subscriptions(): number;
    private subscribeChannel;
    constructor();
    subscribe(callback: EventCallback<T>, cancellationToken?: CancellationToken): EventSubscriptionFacade;
    hasSubscriptions(): boolean;
    cancelAll(): void;
    private afterFire;
    fire(data?: T): void;
    private createSubscription;
    private cancel;
}
//# sourceMappingURL=event_emitter.d.ts.map