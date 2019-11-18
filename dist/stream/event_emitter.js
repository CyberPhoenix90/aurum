export class EventEmitter {
    constructor(config) {
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
    get subscriptions() {
        return this.subscribeChannel.length;
    }
    get oneTimeSubscriptions() {
        return this.subscribeOnceChannel.length;
    }
    linkEvent(eventToLink) {
        if (!this.linkedEvents) {
            this.linkedEvents = [];
        }
        this.linkedEvents.push(eventToLink);
    }
    unlinkEvent(eventToUnlink) {
        if (!this.linkedEvents || !this.linkedEvents.includes(eventToUnlink)) {
            throw new Error('Cannot unlink event that is not linked');
        }
        this.linkedEvents.splice(this.linkedEvents.indexOf(eventToUnlink), 1);
    }
    makeObservable() {
        if (!this.onSubscribe) {
            this.onSubscribe = new EventEmitter();
            this.onSubscribeOnce = new EventEmitter();
            this.onCancelAll = new EventEmitter();
            this.onCancel = new EventEmitter();
        }
    }
    swapSubscriptions(event) {
        const sub = this.subscribeChannel;
        const subOnce = this.subscribeOnceChannel;
        this.subscribeChannel = event.subscribeChannel;
        this.subscribeOnceChannel = event.subscribeOnceChannel;
        event.subscribeChannel = sub;
        event.subscribeOnceChannel = subOnce;
    }
    subscribe(callback, cancellationToken) {
        if (this.onSubscribe) {
            this.onSubscribe.fire();
        }
        const { facade } = this.createSubscription(callback, this.subscribeChannel, cancellationToken);
        return facade;
    }
    hasSubscriptions() {
        return this.subscriptions > 0 || this.oneTimeSubscriptions > 0;
    }
    subscribeOnce(cancellationToken) {
        if (this.onSubscribeOnce) {
            this.onSubscribeOnce.fire();
        }
        return new Promise((resolved) => {
            this.createSubscription((data) => resolved(data), this.subscribeOnceChannel, cancellationToken);
        });
    }
    cancelAll() {
        if (this.onCancelAll !== undefined) {
            this.onCancelAll.fire();
        }
    }
    fire(data, data2, data3, data4, data5) {
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
    createSubscription(callback, channel, cancellationToken) {
        const that = this;
        const subscription = {
            callback
        };
        const facade = {
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
    cancel(subscription, channel) {
        let index = channel.indexOf(subscription);
        if (index >= 0) {
            if (!this.isFiring) {
                channel.splice(index, 1);
            }
            else {
                this.onAfterFire.push(() => this.cancel(subscription, channel));
            }
        }
    }
}
//# sourceMappingURL=event_emitter.js.map