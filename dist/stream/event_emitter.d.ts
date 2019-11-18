import { CancellationToken } from '../utilities/cancellation_token';
export interface EventSubscriptionFacade {
    cancel(): void;
}
export declare type EventCallback<T> = (data: T) => void;
export interface EventConfig {
    observable?: boolean;
    cancellationToken?: CancellationToken;
    throttled?: number;
}
export declare class EventEmitter<T> {
    onSubscribe: EventEmitter<void> | undefined;
    onSubscribeOnce: EventEmitter<void> | undefined;
    onCancelAll: EventEmitter<void> | undefined;
    onCancel: EventEmitter<void> | undefined;
    private isFiring;
    private onAfterFire;
    get subscriptions(): number;
    get oneTimeSubscriptions(): number;
    private linkedEvents;
    private subscribeChannel;
    private subscribeOnceChannel;
    private readonly throttle;
    private throttleCount;
    constructor(config?: EventConfig);
    linkEvent(eventToLink: EventEmitter<T>): void;
    unlinkEvent(eventToUnlink: EventEmitter<T>): void;
    makeObservable(): void;
    swapSubscriptions(event: EventEmitter<T>): void;
    subscribe(callback: EventCallback<T>, cancellationToken?: CancellationToken): EventSubscriptionFacade;
    hasSubscriptions(): boolean;
    subscribeOnce(cancellationToken?: CancellationToken): Promise<T>;
    cancelAll(): void;
    fire(data?: T, data2?: T, data3?: T, data4?: T, data5?: T): void;
    private createSubscription;
    private cancel;
}
//# sourceMappingURL=event_emitter.d.ts.map