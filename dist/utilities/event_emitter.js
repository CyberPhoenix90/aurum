export class EventEmitter {
    constructor() {
        this.subscribeChannel = [];
        this.onAfterFire = [];
    }
    get subscriptions() {
        return this.subscribeChannel.length;
    }
    subscribe(callback, cancellationToken) {
        const { facade } = this.createSubscription(callback, this.subscribeChannel, cancellationToken);
        return facade;
    }
    hasSubscriptions() {
        return this.subscriptions > 0;
    }
    cancelAll() {
        if (!this.isFiring) {
            this.subscribeChannel.length = 0;
        }
        else {
            this.onAfterFire.push(() => (this.subscribeChannel.length = 0));
        }
    }
    afterFire() {
        if (this.onAfterFire.length > 0) {
            this.onAfterFire.forEach((cb) => cb());
            this.onAfterFire.length = 0;
        }
    }
    fire(data) {
        this.isFiring = true;
        const length = this.subscribeChannel.length;
        for (let i = 0; i < length; i++) {
            this.subscribeChannel[i].callback(data);
        }
        this.isFiring = false;
        this.afterFire();
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