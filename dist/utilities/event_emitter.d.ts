import { CancellationToken } from '../utilities/cancellation_token';
import { Callback } from './common';
export interface EventSubscriptionFacade {
    cancel(): void;
}
export declare type EventCallback<T> = (data: T) => void;
export declare class EventEmitter<T> {
    private isFiring;
    private onAfterFire;
    get subscriptions(): number;
    private subscribeChannel;
    constructor();
    subscribe(callback: EventCallback<T>, cancellationToken?: CancellationToken): EventSubscriptionFacade;
    hasSubscriptions(): boolean;
    cancelAll(): void;
    fireFiltered(data: T, filter: Callback<T>): void;
    private afterFire;
    fire(data?: T): void;
    private createSubscription;
    private cancel;
}
//# sourceMappingURL=event_emitter.d.ts.map