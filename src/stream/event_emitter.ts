import { CancellationToken } from '../utilities/cancellation_token';

export interface EventSubscriptionFacade {
	cancel(): void;
}

export type EventCallback<T> = (data: T) => void;

interface EventSubscription<T> {
	callback: EventCallback<T>;
}

export interface EventConfig {
	// if true defines events for this events subscription changes
	observable?: boolean;
	// if passed attaches cancelAll to this token
	cancellationToken?: CancellationToken;
	/**
	 * Fire will only do anything every N executions, it's faster than throttling the callbacks if they all have the same rate
	 */
	throttled?: number;
}

export class EventEmitter<T> {
	public onSubscribe: EventEmitter<void> | undefined;
	public onSubscribeOnce: EventEmitter<void> | undefined;
	public onCancelAll: EventEmitter<void> | undefined;
	public onCancel: EventEmitter<void> | undefined;

	private isFiring: boolean;
	private onAfterFire: Array<() => void>;

	public get subscriptions(): number {
		return this.subscribeChannel.length;
	}

	public get oneTimeSubscriptions(): number {
		return this.subscribeOnceChannel.length;
	}

	private linkedEvents: EventEmitter<T>[] | undefined;
	private subscribeChannel: EventSubscription<T>[];
	private subscribeOnceChannel: EventSubscription<T>[];
	private readonly throttle: number;
	private throttleCount: number;

	constructor(config?: EventConfig) {
		this.subscribeChannel = [];
		this.subscribeOnceChannel = [];
		this.throttleCount = 0;
		this.onAfterFire = [];

		if (config) {
			if (config.observable) {
				this.makeObservable();
			}
			if (config.cancellationToken) {
				config.cancellationToken.addCancelable(() => this.cancelAll());
			}

			if (config.throttled) {
				this.throttle = config.throttled;
			}
		}
	}

	public linkEvent(eventToLink: EventEmitter<T>): void {
		if (!this.linkedEvents) {
			this.linkedEvents = [];
		}

		this.linkedEvents.push(eventToLink);
	}

	public unlinkEvent(eventToUnlink: EventEmitter<T>): void {
		if (!this.linkedEvents || !this.linkedEvents.includes(eventToUnlink)) {
			throw new Error('Cannot unlink event that is not linked');
		}

		this.linkedEvents.splice(this.linkedEvents.indexOf(eventToUnlink), 1);
	}

	public makeObservable(): void {
		if (!this.onSubscribe) {
			this.onSubscribe = new EventEmitter<void>();
			this.onSubscribeOnce = new EventEmitter<void>();
			this.onCancelAll = new EventEmitter<void>();
			this.onCancel = new EventEmitter<void>();
		}
	}

	public swapSubscriptions(event: EventEmitter<T>): void {
		const sub: EventSubscription<T>[] = this.subscribeChannel;
		const subOnce: EventSubscription<T>[] = this.subscribeOnceChannel;

		this.subscribeChannel = event.subscribeChannel;
		this.subscribeOnceChannel = event.subscribeOnceChannel;

		event.subscribeChannel = sub;
		event.subscribeOnceChannel = subOnce;
	}

	public subscribe(callback: EventCallback<T>, cancellationToken?: CancellationToken): EventSubscriptionFacade {
		if (this.onSubscribe) {
			this.onSubscribe.fire();
		}

		const { facade } = this.createSubscription(callback, this.subscribeChannel, cancellationToken);

		return facade;
	}

	public hasSubscriptions(): boolean {
		return this.subscriptions > 0 || this.oneTimeSubscriptions > 0;
	}
	public subscribeOnce(cancellationToken?: CancellationToken): Promise<T> {
		if (this.onSubscribeOnce) {
			this.onSubscribeOnce.fire();
		}

		return new Promise<T>((resolved) => {
			this.createSubscription((data: T) => resolved(data), this.subscribeOnceChannel, cancellationToken);
		});
	}

	public cancelAll(): void {
		if (this.onCancelAll !== undefined) {
			this.onCancelAll.fire();
		}
	}

	public fire(data?: T, data2?: T, data3?: T, data4?: T, data5?: T): void {
		if (this.throttle && this.throttleCount++ % this.throttle !== 0) {
			return;
		}

		this.isFiring = true;

		let length = this.subscribeChannel.length;

		for (let i = 0; i < length; i++) {
			this.subscribeChannel[i].callback(data);
		}

		length = this.subscribeOnceChannel.length;

		if (this.subscribeOnceChannel.length > 0) {
			for (let i = 0; i < length; i++) {
				this.subscribeOnceChannel[i].callback(data);
			}
			this.subscribeOnceChannel.length = 0;
		}

		//TODO: Optimize this to only fire on events that have subscriptions
		if (this.linkedEvents) {
			for (let event of this.linkedEvents) {
				event.fire(data, data2, data3, data4, data5);
			}
		}

		this.isFiring = false;
		if (this.onAfterFire.length > 0) {
			this.onAfterFire.forEach((cb) => cb());
			this.onAfterFire.length = 0;
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
		channel.push(subscription);

		return { subscription, facade };
	}

	private cancel(subscription: EventSubscription<T>, channel: EventSubscription<T>[]): void {
		let index: number = channel.indexOf(subscription);
		if (index >= 0) {
			if (!this.isFiring) {
				channel.splice(index, 1);
			} else {
				this.onAfterFire.push(() => this.cancel(subscription, channel));
			}
		}
	}
}
