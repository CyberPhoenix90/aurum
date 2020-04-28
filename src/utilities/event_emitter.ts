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
export type EventCallback<T> = (data: T) => void;

interface EventSubscription<T> {
	callback: EventCallback<T>;
}

/**
 * @internal
 */
export class EventEmitter<T> {
	private isFiring: boolean;
	private onAfterFire: Array<() => void>;

	public get subscriptions(): number {
		return this.subscribeChannel.length;
	}

	private subscribeChannel: EventSubscription<T>[];
	private subscribeOnceChannel: EventSubscription<T>[];

	constructor() {
		this.subscribeChannel = [];
		this.subscribeOnceChannel = [];
		this.onAfterFire = [];
	}

	public subscribe(callback: EventCallback<T>, cancellationToken?: CancellationToken): EventSubscriptionFacade {
		const { facade } = this.createSubscription(callback, this.subscribeChannel, cancellationToken);

		return facade;
	}

	subscribeOnce(callback: import('./common').Callback<T>, cancellationToken: CancellationToken) {
		const { facade } = this.createSubscription(callback, this.subscribeOnceChannel, cancellationToken);

		return facade;
	}

	public hasSubscriptions(): boolean {
		return this.subscriptions > 0;
	}

	public cancelAll(): void {
		if (!this.isFiring) {
			this.subscribeChannel.length = 0;
			this.subscribeOnceChannel.length = 0;
		} else {
			this.onAfterFire.push(() => {
				this.subscribeChannel.length = 0;
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

	public fire(data?: T): void {
		this.isFiring = true;

		let length = this.subscribeChannel.length;
		for (let i = 0; i < length; i++) {
			this.subscribeChannel[i].callback(data);
		}

		if (this.subscribeOnceChannel.length > 0) {
			length = this.subscribeOnceChannel.length;
			for (let i = 0; i < length; i++) {
				this.subscribeOnceChannel[i].callback(data);
			}
			this.subscribeOnceChannel.length = 0;
		}

		this.isFiring = false;
		this.afterFire();
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
