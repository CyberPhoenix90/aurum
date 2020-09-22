var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
define("stream/operator_model", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OperationType = void 0;
    var OperationType;
    (function (OperationType) {
        OperationType[OperationType["FILTER"] = 0] = "FILTER";
        OperationType[OperationType["NOOP"] = 1] = "NOOP";
        OperationType[OperationType["MAP"] = 2] = "MAP";
        OperationType[OperationType["DELAY"] = 3] = "DELAY";
        OperationType[OperationType["MAP_DELAY"] = 4] = "MAP_DELAY";
        OperationType[OperationType["DELAY_FILTER"] = 5] = "DELAY_FILTER";
        OperationType[OperationType["MAP_DELAY_FILTER"] = 6] = "MAP_DELAY_FILTER";
    })(OperationType = exports.OperationType || (exports.OperationType = {}));
});
define("stream/duplex_data_source", ["require", "exports", "utilities/cancellation_token", "utilities/event_emitter", "stream/data_source"], function (require, exports, cancellation_token_1, event_emitter_1, data_source_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DuplexDataSource = exports.DataFlow = void 0;
    var DataFlow;
    (function (DataFlow) {
        DataFlow[DataFlow["UPSTREAM"] = 0] = "UPSTREAM";
        DataFlow[DataFlow["DOWNSTREAM"] = 1] = "DOWNSTREAM";
    })(DataFlow = exports.DataFlow || (exports.DataFlow = {}));
    /**
     * Same as DataSource except data can flow in both directions
     */
    class DuplexDataSource {
        /**
         *
         * @param initialValue
         * @param propagateWritesToReadStream If a write is done propagate this update back down to all the consumers. Useful at the root node
         */
        constructor(initialValue, propagateWritesToReadStream = true, name = 'RootDuplexDataSource') {
            this.name = name;
            this.value = initialValue;
            this.primed = initialValue !== undefined;
            this.updateDownstreamEvent = new event_emitter_1.EventEmitter();
            this.updateUpstreamEvent = new event_emitter_1.EventEmitter();
            this.propagateWritesToReadStream = propagateWritesToReadStream;
        }
        /**
         * Makes it possible to have 2 completely separate data flow pipelines for each direction
         * @param downStream stream to pipe downstream data to
         * @param upstream  stream to pipe upstream data to
         */
        static fromTwoDataSource(downStream, upstream, initialValue, propagateWritesToReadStream = true) {
            const result = new DuplexDataSource(initialValue, propagateWritesToReadStream);
            //@ts-ignore
            result.updateDownstreamEvent = downStream.updateEvent;
            //@ts-ignore
            result.updateUpstreamEvent = upstream.updateEvent;
            return result;
        }
        /**
         * Updates the data source with a value if it has never had a value before
         */
        withInitial(value) {
            if (!this.primed) {
                this.updateDownstream(value);
            }
            return this;
        }
        /**
         * Allows creating a duplex stream that blocks data in one direction. Useful for plugging into code that uses two way flow but only one way is desired
         * @param direction direction of the dataflow that is allowed
         */
        static createOneWay(direction = DataFlow.DOWNSTREAM, initialValue) {
            return new DuplexDataSource(initialValue, false).oneWayFlow(direction);
        }
        /**
         * Updates the value in the data source and calls the listen callback for all listeners
         * @param newValue new value for the data source
         */
        updateDownstream(newValue) {
            if (this.updatingDownstream) {
                throw new Error('Problem in datas source: Unstable value propagation, when updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed');
            }
            this.primed = true;
            this.updatingDownstream = true;
            this.value = newValue;
            this.updateDownstreamEvent.fire(newValue);
            this.updatingDownstream = false;
        }
        /**
         * Updates the value in the data source and calls the listen callback for all listeners
         * @param newValue new value for the data source
         */
        updateUpstream(newValue) {
            if (this.updatingUpstream) {
                throw new Error('Problem in datas source: Unstable value propagation, when updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed');
            }
            this.primed = true;
            this.updatingUpstream = true;
            this.value = newValue;
            this.updateUpstreamEvent.fire(newValue);
            if (this.propagateWritesToReadStream) {
                this.updateDownstreamEvent.fire(newValue);
            }
            this.updatingUpstream = false;
        }
        /**
         * Same as listen but will immediately call the callback with the current value first
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listenAndRepeat(callback, cancellationToken) {
            callback(this.value);
            return this.listen(callback, cancellationToken);
        }
        /**
         * alias for listenDownstream
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listen(callback, cancellationToken) {
            return this.listenInternal(callback, cancellationToken);
        }
        listenInternal(callback, cancellationToken) {
            return this.updateDownstreamEvent.subscribe(callback, cancellationToken).cancel;
        }
        /**
         * Subscribes exclusively to updates of the data stream that occur due to an update flowing upstream
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listenUpstream(callback, cancellationToken) {
            return this.updateUpstreamEvent.subscribe(callback, cancellationToken).cancel;
        }
        /**
         * Subscribes exclusively to one update of the data stream that occur due to an update flowing upstream
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listenUpstreamOnce(callback, cancellationToken) {
            return this.updateUpstreamEvent.subscribeOnce(callback, cancellationToken).cancel;
        }
        /**
         * Subscribes exclusively to updates of the data stream that occur due to an update flowing downstream
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listenDownstream(callback, cancellationToken) {
            return this.updateDownstreamEvent.subscribe(callback, cancellationToken).cancel;
        }
        downStreamToDataSource(cancellationToken) {
            const downStreamDatasource = new data_source_1.DataSource(this.value);
            this.listenDownstream((newVal) => {
                downStreamDatasource.update(newVal);
            }, cancellationToken);
            return downStreamDatasource;
        }
        /**
         * Combines two sources into a third source that listens to updates from both parent sources.
         * @param otherSource Second parent for the new source
         * @param combinator Method allowing you to combine the data from both parents on update. Called each time a parent is updated with the latest values of both parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
         */
        aggregate(otherSource, combinator, cancellationToken) {
            cancellationToken = cancellationToken !== null && cancellationToken !== void 0 ? cancellationToken : new cancellation_token_1.CancellationToken();
            const aggregatedSource = new data_source_1.DataSource(combinator(this.value, otherSource.value));
            this.listen(() => aggregatedSource.update(combinator(this.value, otherSource.value)), cancellationToken);
            otherSource.listen(() => aggregatedSource.update(combinator(this.value, otherSource.value)), cancellationToken);
            return aggregatedSource;
        }
        /**
         * Combines three sources into a fourth source that listens to updates from all parent sources.
         * @param second Second parent for the new source
         * @param third Third parent for the new source
         * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
         */
        aggregateThree(second, third, combinator, cancellationToken) {
            cancellationToken = cancellationToken !== null && cancellationToken !== void 0 ? cancellationToken : new cancellation_token_1.CancellationToken();
            const aggregatedSource = new data_source_1.DataSource(combinator(this.value, second.value, third.value));
            this.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value)), cancellationToken);
            second.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value)), cancellationToken);
            third.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value)), cancellationToken);
            return aggregatedSource;
        }
        /**
         * Combines four sources into a fifth source that listens to updates from all parent sources.
         * @param second Second parent for the new source
         * @param third Third parent for the new source
         * @param fourth Fourth parent for the new source
         * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
         */
        aggregateFour(second, third, fourth, combinator, cancellationToken) {
            cancellationToken = cancellationToken !== null && cancellationToken !== void 0 ? cancellationToken : new cancellation_token_1.CancellationToken();
            const aggregatedSource = new data_source_1.DataSource(combinator(this.value, second.value, third.value, fourth.value));
            this.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
            second.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
            third.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
            fourth.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
            return aggregatedSource;
        }
        filter(downStreamFilter, upstreamFilter, cancellationToken) {
            if (typeof upstreamFilter === 'function') {
                const filteredSource = new DuplexDataSource(undefined, false);
                this.listenDownstream((newVal) => {
                    if (downStreamFilter(newVal, filteredSource.value)) {
                        filteredSource.updateDownstream(newVal);
                    }
                }, cancellationToken);
                filteredSource.listenUpstream((newVal) => {
                    if (upstreamFilter(newVal, this.value)) {
                        this.updateUpstream(newVal);
                    }
                }, cancellationToken);
                return filteredSource;
            }
            else {
                const filteredSource = new data_source_1.DataSource();
                this.listenDownstream((newVal) => {
                    if (downStreamFilter(newVal, filteredSource.value)) {
                        filteredSource.update(newVal);
                    }
                }, upstreamFilter);
                return filteredSource;
            }
        }
        transform(operationA, operationB, operationC, operationD, operationE, operationF, operationG, operationH, operationI, operationJ, operationK, cancellationToken) {
            let token;
            const operations = [
                operationA,
                operationB,
                operationC,
                operationD,
                operationE,
                operationF,
                operationG,
                operationH,
                operationI,
                operationJ,
                operationK
            ].filter((e) => e && (e instanceof cancellation_token_1.CancellationToken ? ((token = e), false) : true));
            if (cancellationToken) {
                token = cancellationToken;
            }
            const result = new data_source_1.DataSource(undefined, this.name + ' ' + operations.map((v) => v.name).join(' '));
            (this.primed ? this.listenAndRepeat : this.listen).call(this, data_source_1.processTransform(operations, result), token);
            return result;
        }
        /**
         * Forwards all updates from this source to another
         * @param targetDataSource datasource to pipe the updates to
         * @param cancellationToken  Cancellation token to cancel the subscriptions added to the datasources by this operation
         */
        pipe(targetDataSource, cancellationToken) {
            this.listenDownstream((newVal) => targetDataSource.updateDownstream(newVal), cancellationToken);
            targetDataSource.listenUpstream((newVal) => this.updateUpstream(newVal), cancellationToken);
            return this;
        }
        map(mapper, reverseMapper, cancellationToken) {
            if (typeof reverseMapper === 'function') {
                let mappedSource;
                if (this.primed) {
                    mappedSource = new DuplexDataSource(mapper(this.value), false);
                }
                else {
                    mappedSource = new DuplexDataSource(undefined, false);
                }
                this.listenDownstream((v) => mappedSource.updateDownstream(mapper(v)), cancellationToken);
                mappedSource.listenUpstream((v) => this.updateUpstream(reverseMapper(v)), cancellationToken);
                return mappedSource;
            }
            else {
                let mappedSource;
                if (this.primed) {
                    mappedSource = new data_source_1.DataSource(mapper(this.value));
                }
                else {
                    mappedSource = new data_source_1.DataSource();
                }
                this.listenDownstream((v) => mappedSource.update(mapper(v)), reverseMapper);
                return mappedSource;
            }
        }
        listenOnce(callback, cancellationToken) {
            return this.updateDownstreamEvent.subscribeOnce(callback, cancellationToken).cancel;
        }
        /**
         * Returns a promise that resolves when the next update occurs
         * @param cancellationToken
         */
        awaitNextUpdate(cancellationToken) {
            return new Promise((resolve) => {
                this.listenOnce((value) => resolve(value), cancellationToken);
            });
        }
        debounceUpstream(time, cancellationToken) {
            const debouncedDataSource = new DuplexDataSource(this.value);
            let timeout;
            debouncedDataSource.listenUpstream((v) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.updateUpstream(v);
                }, time);
            }, cancellationToken);
            this.listenDownstream((v) => {
                debouncedDataSource.updateDownstream(v);
            }, cancellationToken);
            return debouncedDataSource;
        }
        debounceDownstream(time, cancellationToken) {
            const debouncedDataSource = new DuplexDataSource(this.value);
            let timeout;
            this.listenDownstream((v) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    debouncedDataSource.updateDownstream(v);
                }, time);
            }, cancellationToken);
            debouncedDataSource.listenUpstream((v) => {
                this.updateUpstream(v);
            }, cancellationToken);
            return debouncedDataSource;
        }
        /**
         * Creates a new datasource that listens to this one and forwards updates if they are not the same as the last update
         * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
         */
        unique(cancellationToken) {
            const uniqueSource = new DuplexDataSource(this.value, false);
            let upstreamValue = this.value;
            let downStreamValue = this.value;
            this.listenDownstream((v) => {
                if (downStreamValue !== v) {
                    downStreamValue = v;
                    uniqueSource.updateDownstream(v);
                }
            }, cancellationToken);
            uniqueSource.listenUpstream((v) => {
                if (upstreamValue !== v) {
                    upstreamValue = v;
                    this.updateUpstream(v);
                }
            }, cancellationToken);
            return uniqueSource;
        }
        /**
         * Allows flow of data only in one direction
         * @param direction direction of the dataflow that is allowed
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
         */
        oneWayFlow(direction = DataFlow.DOWNSTREAM, cancellationToken) {
            const oneWaySource = new DuplexDataSource(this.value, false);
            if (direction === DataFlow.DOWNSTREAM) {
                this.listenDownstream((v) => oneWaySource.updateDownstream(v), cancellationToken);
                oneWaySource.updateUpstream = () => void 0;
            }
            else {
                oneWaySource.listenUpstream((v) => this.updateUpstream(v));
                oneWaySource.updateDownstream = () => void 0;
            }
            return oneWaySource;
        }
        /**
         * Creates a new datasource that listens to this source and combines all updates into a single value
         * @param reducer  function that aggregates an update with the previous result of aggregation
         * @param initialValue initial value given to the new source
         * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
         */
        reduce(reducer, initialValue, cancellationToken) {
            const reduceSource = new data_source_1.DataSource(initialValue);
            this.listen((v) => reduceSource.update(reducer(reduceSource.value, v)), cancellationToken);
            return reduceSource;
        }
        /**
         * Remove all listeners
         */
        cancelAll() {
            this.updateDownstreamEvent.cancelAll();
            this.updateUpstreamEvent.cancelAll();
        }
    }
    exports.DuplexDataSource = DuplexDataSource;
});
define("utilities/common", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("utilities/cancellation_token", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CancellationToken = void 0;
    class CancellationToken {
        constructor(...cancellables) {
            this.cancelables = cancellables !== null && cancellables !== void 0 ? cancellables : [];
            this._isCancelled = false;
        }
        get isCanceled() {
            return this._isCancelled;
        }
        hasCancellables() {
            return this.cancelables.length > 0;
        }
        /**
         * Attaches a new cancelable to this token
         * @param delegate
         */
        addCancelable(delegate) {
            this.throwIfCancelled('attempting to add cancellable to token that is already cancelled');
            this.cancelables.push(delegate);
            if (this.cancelables.length === 200) {
                console.log('potential memory leak: cancellation token has over 200 clean up calls');
            }
            return this;
        }
        removeCancelable(delegate) {
            this.throwIfCancelled('attempting to remove cancellable from token that is already cancelled');
            const index = this.cancelables.indexOf(delegate);
            if (index !== -1) {
                this.cancelables.splice(index, 1);
            }
            return this;
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
                id = requestAnimationFrame(f);
                cb(time);
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
    exports.CancellationToken = CancellationToken;
});
define("utilities/event_emitter", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventEmitter = void 0;
    /**
     * @internal
     */
    class EventEmitter {
        constructor() {
            this.subscribeChannel = [];
            this.subscribeOnceChannel = [];
            this.onAfterFire = [];
        }
        static setSubscriptionLeakWarningThreshold(limit) {
            EventEmitter.leakWarningThreshold = limit;
        }
        get subscriptions() {
            return this.subscribeChannel.length + this.subscribeOnceChannel.length;
        }
        subscribe(callback, cancellationToken) {
            const { facade } = this.createSubscription(callback, this.subscribeChannel, cancellationToken);
            if (EventEmitter.leakWarningThreshold && this.subscribeChannel.length > EventEmitter.leakWarningThreshold) {
                console.warn(`Observable has ${this.subscribeChannel.length} subscriptions. This could potentially indicate a memory leak`);
            }
            return facade;
        }
        subscribeOnce(callback, cancellationToken) {
            const { facade } = this.createSubscription(callback, this.subscribeOnceChannel, cancellationToken);
            if (EventEmitter.leakWarningThreshold && this.subscribeOnceChannel.length > EventEmitter.leakWarningThreshold) {
                console.warn(`Observable has ${this.subscribeOnceChannel.length} one time subscriptions. This could potentially indicate a memory leak`);
            }
            return facade;
        }
        hasSubscriptions() {
            return this.subscriptions > 0;
        }
        cancelAll() {
            var _a;
            if (!this.isFiring) {
                this.subscribeChannel.length = 0;
                this.subscribeOnceChannel.length = 0;
                (_a = this.onEmpty) === null || _a === void 0 ? void 0 : _a.call(this);
            }
            else {
                this.onAfterFire.push(() => {
                    var _a;
                    this.subscribeChannel.length = 0;
                    this.subscribeOnceChannel.length = 0;
                    (_a = this.onEmpty) === null || _a === void 0 ? void 0 : _a.call(this);
                });
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
            let length = this.subscribeChannel.length;
            for (let i = 0; i < length; i++) {
                try {
                    this.subscribeChannel[i].callback(data);
                }
                catch (e) {
                    console.error(e);
                }
            }
            if (this.subscribeOnceChannel.length > 0) {
                length = this.subscribeOnceChannel.length;
                for (let i = 0; i < length; i++) {
                    try {
                        this.subscribeOnceChannel[i].callback(data);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                this.subscribeOnceChannel.length = 0;
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
            if (this.isFiring) {
                this.onAfterFire.push(() => channel.push(subscription));
            }
            else {
                channel.push(subscription);
            }
            return { subscription, facade };
        }
        cancel(subscription, channel) {
            var _a;
            let index = channel.indexOf(subscription);
            if (index >= 0) {
                if (!this.isFiring) {
                    channel.splice(index, 1);
                    if (!this.hasSubscriptions()) {
                        (_a = this.onEmpty) === null || _a === void 0 ? void 0 : _a.call(this);
                    }
                }
                else {
                    this.onAfterFire.push(() => this.cancel(subscription, channel));
                }
            }
        }
    }
    exports.EventEmitter = EventEmitter;
});
define("debug_mode", ["require", "exports", "utilities/event_emitter"], function (require, exports, event_emitter_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.debugRegisterConsumer = exports.debugDeclareUpdate = exports.debugRegisterUnlink = exports.debugRegisterLink = exports.debugRegisterStream = exports.enableDebugMode = exports.debugMode = void 0;
    exports.debugMode = false;
    let debugStreamData;
    /**
     * Initializes the debug features of aurum. Required for the use of aurum devtools
     * Run this function before creating any streams or any aurum components for best results
     * Enabling this harms performance and breaks backwards compatibility with some browsers
     * Do not enable in production
     */
    function enableDebugMode() {
        debugStreamData = [];
        exports.debugMode = true;
        setInterval(() => garbageCollect(), 60000);
        window.__debugUpdates = new event_emitter_2.EventEmitter();
        window.__debugNewSource = new event_emitter_2.EventEmitter();
        window.__debugLinked = new event_emitter_2.EventEmitter();
        window.__debugUnlinked = new event_emitter_2.EventEmitter();
        window.__debugGetStreamData = () => debugStreamData.map(serializeStreamData);
    }
    exports.enableDebugMode = enableDebugMode;
    function serializeStreamData(ref) {
        let serializedValue;
        try {
            serializedValue = JSON.stringify(ref.value);
        }
        catch (e) {
            serializedValue = '[Unserializable]';
        }
        return {
            name: ref.name,
            value: serializedValue,
            children: ref.children,
            consumers: ref.consumers,
            id: ref.id,
            parents: ref.parents,
            stack: ref.stack,
            timestamp: ref.timestamp
        };
    }
    function debugRegisterStream(stream, stack) {
        const ref = {
            name: stream.name,
            value: stream.value,
            id: Math.random(),
            children: [],
            parents: [],
            stack,
            timestamp: Date.now(),
            reference: new WeakRef(stream),
            consumers: []
        };
        debugStreamData.push(ref);
        window.__debugNewSource.fire({
            source: serializeStreamData(ref)
        });
    }
    exports.debugRegisterStream = debugRegisterStream;
    function debugRegisterLink(parent, child) {
        let pref = findDataByRef(parent);
        let cref = findDataByRef(child);
        if (!pref) {
            throw new Error('illegal state');
        }
        if (!cref) {
            throw new Error('illegal state');
        }
        pref.children.push(cref.id);
        cref.parents.push(pref.id);
        window.__debugLinked.fire({
            child: serializeStreamData(cref),
            parent: serializeStreamData(pref)
        });
    }
    exports.debugRegisterLink = debugRegisterLink;
    function debugRegisterUnlink(parent, child) {
        let pref = findDataByRef(parent);
        let cref = findDataByRef(child);
        if (!pref) {
            throw new Error('illegal state');
        }
        if (!cref) {
            throw new Error('illegal state');
        }
        const cindex = pref.children.indexOf(cref.id);
        if (cindex === -1) {
            throw new Error('illegal state');
        }
        pref.children.splice(cindex, 1);
        const pindex = cref.parents.indexOf(pref.id);
        if (pindex === -1) {
            throw new Error('illegal state');
        }
        cref.parents.splice(cindex, 1);
        window.__debugUnlinked.fire({
            child: serializeStreamData(cref),
            parent: serializeStreamData(pref)
        });
    }
    exports.debugRegisterUnlink = debugRegisterUnlink;
    function debugDeclareUpdate(source, value, stack) {
        let ref = findDataByRef(source);
        if (!ref) {
            throw new Error('illegal state');
        }
        ref.value = source.value;
        window.__debugUpdates.fire({
            newValue: value,
            source: serializeStreamData(ref),
            stack
        });
    }
    exports.debugDeclareUpdate = debugDeclareUpdate;
    function debugRegisterConsumer(stream, consumer, consumerStack) {
        let ref = findDataByRef(stream);
        if (!ref) {
            throw new Error('illegal state');
        }
        ref.consumers.push({
            code: consumer,
            stack: consumerStack
        });
    }
    exports.debugRegisterConsumer = debugRegisterConsumer;
    function garbageCollect() {
        debugStreamData = debugStreamData.filter((dsd) => dsd.reference.deref() !== undefined);
    }
    function findDataByRef(target) {
        return debugStreamData.find((dsd) => dsd.reference.deref() === target);
    }
});
define("stream/stream", ["require", "exports", "utilities/cancellation_token", "stream/data_source"], function (require, exports, cancellation_token_2, data_source_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Stream = void 0;
    /**
     * Lets you logically combine 2 data sources so that update calls go through the input source and listen goes to the output source
     */
    class Stream {
        constructor() { }
        get name() {
            return `IN:${this.input.name} OUT:${this.output.name}`;
        }
        /**
         * The current value of this data source, can be changed through update
         */
        get value() {
            return this.output.value;
        }
        static fromFetchRaw(url) {
            const input = new data_source_2.DataSource();
            const output = new data_source_2.DataSource();
            input.listen((value) => {
                output.update(fetch(url, value));
            });
            return Stream.fromPreconnectedSources(input, output);
        }
        static fromPreconnectedSources(inputSource, outputSource) {
            const result = new Stream();
            result.input = inputSource !== null && inputSource !== void 0 ? inputSource : new data_source_2.DataSource();
            result.output = outputSource !== null && outputSource !== void 0 ? outputSource : result.input;
            return result;
        }
        static fromStreamTransformation(callback) {
            const result = new Stream();
            result.input = new data_source_2.DataSource();
            result.output = callback(result.input);
            return result;
        }
        static fromFetchPostJson(url, baseRequestData) {
            const input = new data_source_2.DataSource();
            const output = new data_source_2.DataSource();
            input.listen(async (value) => {
                output.update(await fetch(url, Object.assign({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }, baseRequestData, {
                    body: JSON.stringify(value)
                })).then((s) => s.json()));
            });
            return Stream.fromPreconnectedSources(input, output);
        }
        static fromFetchGetJson(url, baseRequestData) {
            const input = new data_source_2.DataSource();
            const output = new data_source_2.DataSource();
            input.listen(async () => {
                output.update(await fetch(url).then((s) => s.json()));
            });
            return Stream.fromPreconnectedSources(input, output);
        }
        update(data) {
            this.input.update(data);
        }
        transform(operationA, operationB, operationC, operationD, operationE, operationF, operationG, operationH, operationI, operationJ, operationK, cancellationToken) {
            let token;
            const operations = [
                operationA,
                operationB,
                operationC,
                operationD,
                operationE,
                operationF,
                operationG,
                operationH,
                operationI,
                operationJ,
                operationK
            ].filter((e) => e && (e instanceof cancellation_token_2.CancellationToken ? ((token = e), false) : true));
            if (cancellationToken) {
                token = cancellationToken;
            }
            const result = new data_source_2.DataSource(undefined, this.output.name + ' ' + operations.map((v) => v.name).join(' '));
            this.listen(data_source_2.processTransform(operations, result), token);
            return Stream.fromPreconnectedSources(this.input, result);
        }
        getOutput() {
            return this.output;
        }
        listen(callback, cancellationToken) {
            return this.output.listen(callback, cancellationToken);
        }
        listenAndRepeat(callback, cancellationToken) {
            return this.output.listenAndRepeat(callback, cancellationToken);
        }
        listenOnce(callback, cancellationToken) {
            return this.output.listenOnce(callback, cancellationToken);
        }
        awaitNextUpdate(cancellationToken) {
            return this.output.awaitNextUpdate(cancellationToken);
        }
        cancelAll() {
            this.input.cancelAll();
            this.output.cancelAll();
        }
    }
    exports.Stream = Stream;
});
define("stream/data_source", ["require", "exports", "debug_mode", "utilities/cancellation_token", "utilities/event_emitter", "stream/operator_model"], function (require, exports, debug_mode_1, cancellation_token_3, event_emitter_3, operator_model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.processTransform = exports.FilteredArrayView = exports.SortedArrayView = exports.UniqueArrayView = exports.ReversedArrayView = exports.MappedArrayView = exports.ArrayDataSource = exports.DataSource = void 0;
    /**
     * Datasources wrap a value and allow you to update it in an observable way. Datasources can be manipulated like streams and can be bound directly in the JSX syntax and will update the html whenever the value changes
     */
    class DataSource {
        constructor(initialValue, name = 'RootDataSource') {
            this.name = name;
            this.value = initialValue;
            if (debug_mode_1.debugMode) {
                debug_mode_1.debugRegisterStream(this, new Error().stack);
            }
            this.primed = initialValue !== undefined;
            this.updateEvent = new event_emitter_3.EventEmitter();
        }
        static fromMultipleSources(sources, cancellation) {
            const result = new DataSource();
            for (const s of sources) {
                if (debug_mode_1.debugMode) {
                    debug_mode_1.debugRegisterLink(s, result);
                }
                s.listenInternal((v) => result.update(v), cancellation);
            }
            result.name = `Combination of [${sources.map((v) => v.name).join(' & ')}]`;
            return result;
        }
        /**
         * Updates with the same value as the last value
         */
        repeatLast() {
            this.update(this.value);
            return this;
        }
        /**
         * Updates the value in the data source and calls the listen callback for all listeners
         * @param newValue new value for the data source
         */
        update(newValue) {
            this.primed = true;
            if (this.updating) {
                throw new Error('Problem in data source: Unstable value propagation. When updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed');
            }
            this.updating = true;
            this.value = newValue;
            this.updateEvent.fire(newValue);
            if (debug_mode_1.debugMode) {
                debug_mode_1.debugDeclareUpdate(this, newValue, new Error().stack);
            }
            this.updating = false;
        }
        /**
         * Updates the data source with a value if it has never had a value before
         */
        withInitial(value) {
            if (!this.primed) {
                this.update(value);
            }
            return this;
        }
        /**
         * Same as listen but will immediately call the callback with the current value first
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listenAndRepeat(callback, cancellationToken) {
            callback(this.value);
            return this.listen(callback, cancellationToken);
        }
        listenAndRepeatInternal(callback, cancellationToken, parent) {
            callback(this.value);
            return this.listenInternal(callback, cancellationToken, parent);
        }
        /**
         * Subscribes to the updates of the data stream
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listen(callback, cancellationToken) {
            if (debug_mode_1.debugMode) {
                debug_mode_1.debugRegisterConsumer(this, callback.toString(), new Error().stack);
            }
            return this.listenInternal(callback, cancellationToken);
        }
        listenInternal(callback, cancellationToken, parent) {
            const cancel = this.updateEvent.subscribe(callback, cancellationToken).cancel;
            return cancel;
        }
        /**
         * Subscribes to the updates of the data stream for a single update
         * @param callback Callback to call when value is updated
         * @param cancellationToken Optional token to control the cancellation of the subscription
         * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
         */
        listenOnce(callback, cancellationToken) {
            return this.updateEvent.subscribeOnce(callback, cancellationToken).cancel;
        }
        transform(operationA, operationB, operationC, operationD, operationE, operationF, operationG, operationH, operationI, operationJ, operationK, cancellationToken) {
            let token;
            const operations = [
                operationA,
                operationB,
                operationC,
                operationD,
                operationE,
                operationF,
                operationG,
                operationH,
                operationI,
                operationJ,
                operationK
            ].filter((e) => e && (e instanceof cancellation_token_3.CancellationToken ? ((token = e), false) : true));
            if (cancellationToken) {
                token = cancellationToken;
            }
            const result = new DataSource(undefined, this.name + ' ' + operations.map((v) => v.name).join(' '));
            if (debug_mode_1.debugMode) {
                debug_mode_1.debugRegisterLink(this, result);
            }
            (this.primed ? this.listenAndRepeatInternal : this.listenInternal).call(this, processTransform(operations, result), token);
            return result;
        }
        /**
         * Combines two sources into a third source that listens to updates from both parent sources.
         * @param otherSource Second parent for the new source
         * @param combinator Method allowing you to combine the data from both parents on update. Called each time a parent is updated with the latest values of both parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
         */
        aggregate(otherSource, combinator, cancellationToken) {
            cancellationToken = cancellationToken !== null && cancellationToken !== void 0 ? cancellationToken : new cancellation_token_3.CancellationToken();
            const aggregatedSource = new DataSource(combinator(this.value, otherSource.value));
            this.listen(() => aggregatedSource.update(combinator(this.value, otherSource.value)), cancellationToken);
            otherSource.listen(() => aggregatedSource.update(combinator(this.value, otherSource.value)), cancellationToken);
            return aggregatedSource;
        }
        /**
         * Combines three sources into a fourth source that listens to updates from all parent sources.
         * @param second Second parent for the new source
         * @param third Third parent for the new source
         * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
         */
        aggregateThree(second, third, combinator, cancellationToken) {
            cancellationToken = cancellationToken !== null && cancellationToken !== void 0 ? cancellationToken : new cancellation_token_3.CancellationToken();
            const aggregatedSource = new DataSource(combinator(this.value, second.value, third.value));
            this.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value)), cancellationToken);
            second.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value)), cancellationToken);
            third.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value)), cancellationToken);
            return aggregatedSource;
        }
        /**
         * Combines four sources into a fifth source that listens to updates from all parent sources.
         * @param second Second parent for the new source
         * @param third Third parent for the new source
         * @param fourth Fourth parent for the new source
         * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
         */
        aggregateFour(second, third, fourth, combinator, cancellationToken) {
            cancellationToken = cancellationToken !== null && cancellationToken !== void 0 ? cancellationToken : new cancellation_token_3.CancellationToken();
            const aggregatedSource = new DataSource(combinator(this.value, second.value, third.value, fourth.value));
            this.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
            second.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
            third.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
            fourth.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
            return aggregatedSource;
        }
        /**
         * Combines four sources into a fifth source that listens to updates from all parent sources.
         * @param second Second parent for the new source
         * @param third Third parent for the new source
         * @param fourth Fourth parent for the new source
         * @param fifth Fifth  parent for the new source
         * @param combinator Method allowing you to combine the data from all parents on update. Called each time a parent is updated with the latest values of all parents
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the parent datasources
         */
        aggregateFive(second, third, fourth, fifth, combinator, cancellationToken) {
            cancellationToken = cancellationToken !== null && cancellationToken !== void 0 ? cancellationToken : new cancellation_token_3.CancellationToken();
            const aggregatedSource = new DataSource(combinator(this.value, second.value, third.value, fourth.value, fifth.value));
            this.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value, fifth.value)), cancellationToken);
            second.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value, fifth.value)), cancellationToken);
            third.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value, fifth.value)), cancellationToken);
            fourth.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value, fifth.value)), cancellationToken);
            fifth.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value, fifth.value)), cancellationToken);
            return aggregatedSource;
        }
        /**
         * Forwards all updates from this source to another
         * @param targetDataSource datasource to pipe the updates to
         * @param cancellationToken  Cancellation token to cancel the subscription the target datasource has to this datasource
         */
        pipe(targetDataSource, cancellationToken) {
            this.listen((v) => targetDataSource.update(v), cancellationToken);
            return this;
        }
        /**
         * Like aggregate except that no combination method is needed as a result both parents must have the same type and the new stream just exposes the last update recieved from either parent
         * @param otherSource Second parent for the new source
         * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
         */
        combine(otherSources, cancellationToken) {
            cancellationToken = cancellationToken !== null && cancellationToken !== void 0 ? cancellationToken : new cancellation_token_3.CancellationToken();
            let combinedDataSource;
            if (this.primed) {
                combinedDataSource = new DataSource(this.value);
            }
            else {
                combinedDataSource = new DataSource();
            }
            this.pipe(combinedDataSource, cancellationToken);
            for (const otherSource of otherSources) {
                otherSource.pipe(combinedDataSource, cancellationToken);
            }
            return combinedDataSource;
        }
        /**
         * Returns a promise that resolves when the next update occurs
         * @param cancellationToken
         */
        awaitNextUpdate(cancellationToken) {
            return new Promise((resolve) => {
                this.listenOnce((value) => resolve(value), cancellationToken);
            });
        }
        /**
         * Remove all listeners
         */
        cancelAll() {
            this.updateEvent.cancelAll();
        }
    }
    exports.DataSource = DataSource;
    class ArrayDataSource {
        constructor(initialData, name = 'RootArrayDataSource') {
            this.name = name;
            if (initialData) {
                this.data = initialData.slice();
            }
            else {
                this.data = [];
            }
            this.lengthSource = new DataSource(this.data.length, this.name + '.length');
            this.updateEvent = new event_emitter_3.EventEmitter();
        }
        static fromMultipleSources(sources, cancellationToken) {
            var _a;
            const boundaries = [0];
            const result = new ArrayDataSource(undefined, `ArrayDataSource of (${sources.reduce((p, c) => p + (c instanceof ArrayDataSource ? c.name + ' ' : ''), '')})`);
            for (let i = 0; i < sources.length; i++) {
                if (Array.isArray(sources[i])) {
                    result.appendArray(sources[i]);
                }
                else {
                    result.appendArray((_a = sources[i].data) !== null && _a !== void 0 ? _a : []);
                    let index = i;
                    sources[i].listen((change) => {
                        switch (change.operationDetailed) {
                            case 'append':
                            case 'prepend':
                            case 'insert':
                                result.insertAt(change.index + boundaries[index], ...change.items);
                                for (let i = index + 1; i < boundaries.length; i++) {
                                    boundaries[i] += change.count;
                                }
                                break;
                            case 'remove':
                            case 'removeLeft':
                            case 'removeRight':
                            case 'clear':
                                result.removeRange(change.index + boundaries[index], change.index + boundaries[index] + change.count);
                                for (let i = index + 1; i < boundaries.length; i++) {
                                    boundaries[i] -= change.count;
                                }
                                break;
                            case 'merge':
                                throw new Error('Not yet supported');
                            case 'replace':
                                result.set(change.index + boundaries[index], change.items[0]);
                                break;
                            case 'swap':
                                result.swap(change.index + boundaries[index], change.index2 + boundaries[index]);
                                break;
                        }
                    }, cancellationToken);
                }
                boundaries.push(result.length.value);
            }
            return result;
        }
        /**
         * Same as listen but will immediately call the callback with an append of all existing elements first
         */
        listenAndRepeat(callback, cancellationToken) {
            callback({
                operation: 'add',
                operationDetailed: 'append',
                index: 0,
                items: this.data,
                newState: this.data,
                count: this.data.length
            });
            return this.listen(callback, cancellationToken);
        }
        repeatCurrentState() {
            this.update({
                operation: 'remove',
                operationDetailed: 'clear',
                count: this.data.length,
                index: 0,
                items: this.data,
                newState: []
            });
            this.update({
                operation: 'add',
                operationDetailed: 'append',
                index: 0,
                items: this.data,
                newState: this.data,
                count: this.data.length
            });
        }
        listen(callback, cancellationToken) {
            return this.updateEvent.subscribe(callback, cancellationToken).cancel;
        }
        listenOnce(callback, cancellationToken) {
            return this.updateEvent.subscribeOnce(callback, cancellationToken).cancel;
        }
        /**
         * Returns a promise that resolves when the next update occurs
         * @param cancellationToken
         */
        awaitNextUpdate(cancellationToken) {
            return new Promise((resolve) => {
                this.listenOnce((value) => resolve(value), cancellationToken);
            });
        }
        get length() {
            return this.lengthSource;
        }
        getData() {
            return this.data;
        }
        get(index) {
            return this.data[index];
        }
        set(index, item) {
            const old = this.data[index];
            if (old === item) {
                return;
            }
            this.data[index] = item;
            this.update({ operation: 'replace', operationDetailed: 'replace', target: old, count: 1, index, items: [item], newState: this.data });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
        }
        indexOf(item) {
            return this.data.indexOf(item);
        }
        lastIndexOf(item) {
            return this.data.lastIndexOf(item);
        }
        includes(item) {
            return this.data.includes(item);
        }
        replace(item, newItem) {
            const index = this.indexOf(item);
            if (index !== -1) {
                this.set(index, newItem);
            }
        }
        swap(indexA, indexB) {
            if (indexA === indexB) {
                return;
            }
            const itemA = this.data[indexA];
            const itemB = this.data[indexB];
            this.data[indexB] = itemA;
            this.data[indexA] = itemB;
            this.update({ operation: 'swap', operationDetailed: 'swap', index: indexA, index2: indexB, items: [itemA, itemB], newState: this.data });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
        }
        swapItems(itemA, itemB) {
            if (itemA === itemB) {
                return;
            }
            const indexA = this.data.indexOf(itemA);
            const indexB = this.data.indexOf(itemB);
            if (indexA !== -1 && indexB !== -1) {
                this.data[indexB] = itemA;
                this.data[indexA] = itemB;
            }
            this.update({ operation: 'swap', operationDetailed: 'swap', index: indexA, index2: indexB, items: [itemA, itemB], newState: this.data });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
        }
        appendArray(items) {
            if (items.length < 65000) {
                this.data.push.apply(this.data, items);
            }
            else {
                console.warn('Appending over 65000 items in one go can lead to performance issues. Consider streaming your changes progressively');
                this.data = this.data.concat(items);
            }
            this.update({
                operation: 'add',
                operationDetailed: 'append',
                count: items.length,
                index: this.data.length - items.length,
                items,
                newState: this.data
            });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
        }
        insertAt(index, ...items) {
            if (items.length === 0) {
                return;
            }
            this.data.splice(index, 0, ...items);
            this.update({
                operation: 'add',
                operationDetailed: 'insert',
                count: items.length,
                index,
                items,
                newState: this.data
            });
            this.lengthSource.update(this.data.length);
        }
        push(...items) {
            this.appendArray(items);
        }
        unshift(...items) {
            this.data.unshift(...items);
            this.update({ operation: 'add', operationDetailed: 'prepend', count: items.length, items, index: 0, newState: this.data });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
        }
        pop() {
            const item = this.data.pop();
            this.update({
                operation: 'remove',
                operationDetailed: 'removeRight',
                count: 1,
                index: this.data.length,
                items: [item],
                newState: this.data
            });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
            return item;
        }
        merge(newData) {
            const old = this.data;
            this.data = newData.slice();
            this.update({
                operation: 'merge',
                operationDetailed: 'merge',
                previousState: old,
                index: 0,
                items: this.data,
                newState: this.data
            });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
        }
        removeRight(count) {
            const length = this.data.length;
            const result = this.data.splice(length - count, count);
            this.update({ operation: 'remove', operationDetailed: 'removeRight', count, index: length - count, items: result, newState: this.data });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
        }
        removeLeft(count) {
            const result = this.data.splice(0, count);
            this.update({ operation: 'remove', operationDetailed: 'removeLeft', count, index: 0, items: result, newState: this.data });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
        }
        removeAt(index) {
            const removed = this.data.splice(index, 1);
            this.update({ operation: 'remove', operationDetailed: 'remove', count: removed.length, index, items: removed, newState: this.data });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
        }
        removeRange(start, end) {
            const removed = this.data.splice(start, end - start);
            this.update({ operation: 'remove', operationDetailed: 'remove', count: removed.length, index: start, items: removed, newState: this.data });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
        }
        remove(item) {
            const index = this.data.indexOf(item);
            if (index !== -1) {
                this.removeAt(index);
            }
        }
        clear() {
            if (this.data.length === 0) {
                return;
            }
            const items = this.data;
            this.data = [];
            this.update({
                operation: 'remove',
                operationDetailed: 'clear',
                count: items.length,
                index: 0,
                items,
                newState: this.data
            });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
        }
        shift() {
            const item = this.data.shift();
            this.update({ operation: 'remove', operationDetailed: 'removeLeft', items: [item], count: 1, index: 0, newState: this.data });
            if (this.lengthSource.value !== this.data.length) {
                this.lengthSource.update(this.data.length);
            }
            return item;
        }
        toArray() {
            return this.data.slice();
        }
        reverse(cancellationToken) {
            const view = new ReversedArrayView(this, cancellationToken, this.name + '.reverse()');
            return view;
        }
        sort(comparator, dependencies = [], cancellationToken) {
            const view = new SortedArrayView(this, comparator, cancellationToken, this.name + '.sort()');
            dependencies.forEach((dep) => {
                dep.listen(() => view.refresh());
            }, cancellationToken);
            return view;
        }
        map(mapper, dependencies = [], cancellationToken) {
            const view = new MappedArrayView(this, mapper, cancellationToken, this.name + '.map()');
            dependencies.forEach((dep) => {
                dep.listen(() => view.refresh());
            }, cancellationToken);
            return view;
        }
        unique(cancellationToken) {
            return new UniqueArrayView(this, cancellationToken, this.name + '.unique()');
        }
        filter(callback, dependencies = [], cancellationToken) {
            const view = new FilteredArrayView(this, callback, cancellationToken, this.name + '.filter()');
            dependencies.forEach((dep) => {
                dep.listen(() => view.refresh(), cancellationToken);
            });
            return view;
        }
        forEach(callbackfn) {
            return this.data.forEach(callbackfn);
        }
        update(change) {
            this.updateEvent.fire(change);
        }
    }
    exports.ArrayDataSource = ArrayDataSource;
    class MappedArrayView extends ArrayDataSource {
        constructor(parent, mapper, cancellationToken = new cancellation_token_3.CancellationToken(), name) {
            const initial = parent.getData().map(mapper);
            super(initial, name);
            this.parent = parent;
            this.mapper = mapper;
            parent.listen((change) => {
                switch (change.operationDetailed) {
                    case 'removeLeft':
                        this.removeLeft(change.count);
                        break;
                    case 'removeRight':
                        this.removeRight(change.count);
                        break;
                    case 'remove':
                        this.remove(this.data[change.index]);
                        break;
                    case 'clear':
                        this.clear();
                        break;
                    case 'prepend':
                        this.unshift(...change.items.map(this.mapper));
                        break;
                    case 'append':
                        this.appendArray(change.items.map(this.mapper));
                        break;
                    case 'insert':
                        this.insertAt(change.index, ...change.items.map(this.mapper));
                        break;
                    case 'swap':
                        this.swap(change.index, change.index2);
                        break;
                    case 'replace':
                        this.set(change.index, this.mapper(change.items[0]));
                        break;
                    case 'merge':
                        const old = this.data.slice();
                        const source = change.previousState.slice();
                        for (let i = 0; i < change.newState.length; i++) {
                            if (this.data.length <= i) {
                                this.data.push(this.mapper(change.newState[i]));
                                source.push(change.newState[i]);
                            }
                            else if (source[i] !== change.newState[i]) {
                                const index = source.indexOf(change.newState[i]);
                                if (index !== -1) {
                                    const a = this.data[i];
                                    const b = this.data[index];
                                    this.data[i] = b;
                                    this.data[index] = a;
                                    const c = source[i];
                                    const d = source[index];
                                    source[i] = d;
                                    source[index] = c;
                                }
                                else {
                                    //@ts-ignore
                                    this.data.splice(i, 0, this.mapper(change.newState[i]));
                                    source.splice(i, 0, change.newState[i]);
                                }
                            }
                        }
                        if (this.data.length > change.newState.length) {
                            this.data.length = change.newState.length;
                        }
                        this.update({
                            operation: 'merge',
                            operationDetailed: 'merge',
                            previousState: old,
                            index: 0,
                            items: this.data,
                            newState: this.data
                        });
                        break;
                }
            }, cancellationToken);
        }
        refresh() {
            //@ts-ignore
            this.merge(this.parent.data.map(this.mapper));
        }
    }
    exports.MappedArrayView = MappedArrayView;
    class ReversedArrayView extends ArrayDataSource {
        constructor(parent, cancellationToken = new cancellation_token_3.CancellationToken(), name) {
            const initial = parent
                .getData()
                .slice()
                .reverse();
            super(initial, name);
            this.parent = parent;
            parent.listen((change) => {
                switch (change.operationDetailed) {
                    case 'removeLeft':
                        this.removeRight(change.count);
                        break;
                    case 'removeRight':
                        this.removeLeft(change.count);
                        break;
                    case 'remove':
                        for (const item of change.items) {
                            this.remove(item);
                        }
                        break;
                    case 'clear':
                        this.clear();
                        break;
                    case 'prepend':
                        this.appendArray(change.items.reverse());
                        break;
                    case 'append':
                        this.unshift(...change.items.reverse());
                        break;
                    case 'insert':
                        this.merge(change.newState.slice().reverse());
                        break;
                    case 'merge':
                        this.merge(change.items.slice().reverse());
                        break;
                    case 'swap':
                        this.merge(change.newState.slice().reverse());
                        break;
                    case 'replace':
                        this.merge(change.newState.slice().reverse());
                        break;
                }
            }, cancellationToken);
        }
        refresh() {
            this.merge(this.parent
                .getData()
                .slice()
                .reverse());
        }
    }
    exports.ReversedArrayView = ReversedArrayView;
    class UniqueArrayView extends ArrayDataSource {
        constructor(parent, cancellationToken = new cancellation_token_3.CancellationToken(), name) {
            const initial = Array.from(new Set(parent.getData()));
            super(initial, name);
            let filteredItems;
            parent.listen((change) => {
                switch (change.operationDetailed) {
                    case 'removeLeft':
                    case 'removeRight':
                    case 'remove':
                        for (const item of change.items) {
                            if (!change.newState.includes(item)) {
                                this.remove(item);
                            }
                        }
                        break;
                    case 'clear':
                        this.clear();
                        break;
                    case 'prepend':
                        filteredItems = change.items.filter((e) => !this.data.includes(e));
                        this.unshift(...filteredItems);
                        break;
                    case 'append':
                        filteredItems = change.items.filter((e) => !this.data.includes(e));
                        this.appendArray(filteredItems);
                        break;
                    case 'insert':
                        filteredItems = change.items.filter((e) => !this.data.includes(e));
                        this.insertAt(change.index, ...filteredItems);
                        break;
                    case 'merge':
                        this.merge(Array.from(new Set(parent.getData())));
                        break;
                    case 'swap':
                        this.swap(change.index, change.index2);
                        break;
                    case 'replace':
                        if (this.data.includes(change.items[0])) {
                            this.remove(change.target);
                        }
                        else {
                            this.set(change.index, change.items[0]);
                        }
                        break;
                }
            }, cancellationToken);
        }
    }
    exports.UniqueArrayView = UniqueArrayView;
    class SortedArrayView extends ArrayDataSource {
        constructor(parent, comparator, cancellationToken = new cancellation_token_3.CancellationToken(), name) {
            const initial = parent
                .getData()
                .slice()
                .sort(comparator);
            super(initial, name);
            this.parent = parent;
            this.comparator = comparator;
            parent.listen((change) => {
                switch (change.operationDetailed) {
                    case 'removeLeft':
                    case 'removeRight':
                    case 'remove':
                        for (const item of change.items) {
                            this.remove(item);
                        }
                        break;
                    case 'clear':
                        this.clear();
                        break;
                    case 'prepend':
                        this.unshift(...change.items);
                        this.data.sort(this.comparator);
                        break;
                    case 'append':
                        this.appendSorted(change.items);
                        break;
                    case 'insert':
                        this.appendSorted(change.items);
                        break;
                    case 'merge':
                        this.merge(change.items.slice().sort(this.comparator));
                        break;
                    case 'swap':
                        break;
                    case 'replace':
                        this.remove(change.target);
                        this.appendSorted(change.items);
                        break;
                }
            }, cancellationToken);
        }
        appendSorted(items) {
            this.merge(this.data.concat(items).sort(this.comparator));
        }
        refresh() {
            this.merge(this.parent
                .getData()
                .slice()
                .sort(this.comparator));
        }
    }
    exports.SortedArrayView = SortedArrayView;
    class FilteredArrayView extends ArrayDataSource {
        constructor(parent, filter, cancellationToken = new cancellation_token_3.CancellationToken(), name) {
            if (Array.isArray(parent)) {
                parent = new ArrayDataSource(parent);
            }
            filter = filter !== null && filter !== void 0 ? filter : (() => true);
            const initial = parent.data.filter(filter);
            super(initial, name);
            this.parent = parent;
            this.viewFilter = filter;
            parent.listen((change) => {
                let filteredItems;
                switch (change.operationDetailed) {
                    case 'clear':
                        this.clear();
                        break;
                    case 'removeLeft':
                    case 'removeRight':
                    case 'remove':
                        for (const item of change.items) {
                            this.remove(item);
                        }
                        break;
                    case 'prepend':
                        filteredItems = change.items.filter(this.viewFilter);
                        this.unshift(...filteredItems);
                        break;
                    case 'append':
                        filteredItems = change.items.filter(this.viewFilter);
                        this.appendArray(filteredItems);
                        break;
                    case 'insert':
                        filteredItems = change.items.filter(this.viewFilter);
                        this.insertAt(change.index, ...filteredItems);
                        break;
                    case 'merge':
                        this.merge(change.items.filter(this.viewFilter));
                        break;
                    case 'swap':
                        const indexA = this.data.indexOf(change.items[0]);
                        const indexB = this.data.indexOf(change.items[1]);
                        if (indexA !== -1 && indexB !== -1) {
                            this.swap(indexA, indexB);
                        }
                        break;
                    case 'replace':
                        const index = this.data.indexOf(change.target);
                        if (index !== -1) {
                            const acceptNew = this.viewFilter(change.items[0]);
                            if (acceptNew) {
                                this.set(index, change.items[0]);
                            }
                            else {
                                this.remove(change.target);
                            }
                        }
                        break;
                }
            }, cancellationToken);
        }
        /**
         * Replaces the filter function
         * @param filter
         * @returns returns new size of array view after applying filter
         */
        updateFilter(filter) {
            if (this.viewFilter === filter) {
                return;
            }
            this.viewFilter = filter;
            this.refresh();
            return this.data.length;
        }
        /**
         * Recalculates the filter. Only needed if your filter function isn't pure and you know the result would be different if run again compared to before
         */
        refresh() {
            this.merge(this.parent.data.filter(this.viewFilter));
        }
    }
    exports.FilteredArrayView = FilteredArrayView;
    function processTransform(operations, result) {
        return async (v) => {
            for (const operation of operations) {
                switch (operation.operationType) {
                    case operator_model_1.OperationType.NOOP:
                    case operator_model_1.OperationType.MAP:
                        v = operation.operation(v);
                        break;
                    case operator_model_1.OperationType.MAP_DELAY_FILTER:
                        const tmp = await operation.operation(v);
                        if (tmp.cancelled) {
                            return;
                        }
                        else {
                            v = await tmp.item;
                        }
                        break;
                    case operator_model_1.OperationType.DELAY:
                    case operator_model_1.OperationType.MAP_DELAY:
                        v = await operation.operation(v);
                        break;
                    case operator_model_1.OperationType.DELAY_FILTER:
                        if (!(await operation.operation(v))) {
                            return;
                        }
                        break;
                    case operator_model_1.OperationType.FILTER:
                        if (!operation.operation(v)) {
                            return;
                        }
                        break;
                }
            }
            result.update(v);
        };
    }
    exports.processTransform = processTransform;
});
define("rendering/classname", ["require", "exports", "stream/data_source", "stream/duplex_data_source"], function (require, exports, data_source_3, duplex_data_source_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.aurumClassName = void 0;
    function aurumClassName(data, cancellationToken) {
        const result = [];
        for (const key in data) {
            if (data[key]) {
                if (data[key] instanceof data_source_3.DataSource || data[key] instanceof duplex_data_source_1.DuplexDataSource) {
                    const source = data[key];
                    const mappedSource = new data_source_3.DataSource(source.value ? key : '');
                    source.listen((value) => {
                        mappedSource.update(value ? key : '');
                    }, cancellationToken);
                    result.push(mappedSource);
                }
                else {
                    result.push(key);
                }
            }
        }
        return result;
    }
    exports.aurumClassName = aurumClassName;
});
define("rendering/aurum_element", ["require", "exports", "stream/data_source", "stream/duplex_data_source", "stream/stream", "utilities/cancellation_token", "rendering/classname"], function (require, exports, data_source_4, duplex_data_source_2, stream_1, cancellation_token_4, classname_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SingularAurumElement = exports.ArrayAurumElement = exports.createAPI = exports.pendingSessions = exports.render = exports.AurumElement = exports.nodeData = exports.aurumElementModelIdentitiy = exports.createRenderSession = void 0;
    function createRenderSession() {
        const session = {
            attachCalls: [],
            sessionToken: new cancellation_token_4.CancellationToken(() => {
                for (const token of session.tokens) {
                    token.cancel();
                }
            }),
            tokens: []
        };
        return session;
    }
    exports.createRenderSession = createRenderSession;
    exports.aurumElementModelIdentitiy = Symbol('AurumElementModel');
    exports.nodeData = new WeakMap();
    class AurumElement {
        constructor(dataSource, api) {
            this.children = [];
            this.api = api;
            this.api.onAttach(() => {
                if (this.hostNode === undefined) {
                    throw new Error('illegal state: Attach fired but not actually attached');
                }
                this.render(dataSource);
            });
        }
        dispose() {
            this.clearContent();
        }
        attachToDom(node, index) {
            if (this.hostNode) {
                throw new Error('Aurum Element is already attached');
            }
            const id = AurumElement.id++;
            this.hostNode = node;
            this.contentStartMarker = document.createComment('START Aurum Node ' + id);
            this.contentEndMarker = document.createComment('END Aurum Node ' + id);
            if (index >= node.childNodes.length) {
                node.appendChild(this.contentStartMarker);
                node.appendChild(this.contentEndMarker);
            }
            else {
                node.insertBefore(this.contentStartMarker, node.childNodes[index]);
                node.insertBefore(this.contentEndMarker, node.childNodes[index + 1]);
            }
        }
        getWorkIndex() {
            if (this.lastStartIndex !== undefined && this.hostNode.childNodes[this.lastStartIndex] === this.contentStartMarker) {
                return this.lastStartIndex + 1;
            }
            for (let i = 0; i < this.hostNode.childNodes.length; i++) {
                if (this.hostNode.childNodes[i] === this.contentStartMarker) {
                    this.lastStartIndex = i;
                    return i + 1;
                }
            }
        }
        getLastIndex() {
            if (this.lastEndIndex !== undefined && this.hostNode.childNodes[this.lastEndIndex] === this.contentEndMarker) {
                return this.lastEndIndex;
            }
            for (let i = 0; i < this.hostNode.childNodes.length; i++) {
                if (this.hostNode.childNodes[i] === this.contentEndMarker) {
                    this.lastEndIndex = i;
                    return i;
                }
            }
        }
        clearContent() {
            if (this.hostNode === undefined) {
                throw new Error('illegal state: Aurum element was not attched to anything');
            }
            let workIndex = this.getWorkIndex();
            while (this.hostNode.childNodes[workIndex] !== this.contentEndMarker) {
                if (!(this.hostNode.childNodes[workIndex] instanceof Comment)) {
                    this.hostNode.removeChild(this.hostNode.childNodes[workIndex]);
                }
                else {
                    workIndex++;
                }
            }
        }
        updateDom() {
            var _a;
            if (this.hostNode === undefined) {
                throw new Error('illegal state: Aurum element was not attched to anything');
            }
            const workIndex = this.getWorkIndex();
            let i;
            let offset = 0;
            for (i = 0; i < this.children.length; i++) {
                const child = this.children[i];
                if (child === undefined || child === null) {
                    offset--;
                    continue;
                }
                if (child instanceof AurumElement) {
                    if (!child.hostNode) {
                        child.attachToDom(this.hostNode, i + workIndex + offset);
                    }
                    offset += child.getLastIndex() - i - offset - workIndex;
                    continue;
                }
                if (this.hostNode.childNodes[i + workIndex + offset] !== this.contentEndMarker &&
                    this.hostNode.childNodes[i + workIndex + offset] !== this.children[i] &&
                    this.hostNode.childNodes[i + workIndex + offset] !== ((_a = this.children[i + 1]) === null || _a === void 0 ? void 0 : _a.contentStartMarker)) {
                    if (child instanceof HTMLElement || child instanceof Text) {
                        this.hostNode.removeChild(this.hostNode.childNodes[i + workIndex + offset]);
                        if (this.hostNode.childNodes[i + workIndex + offset]) {
                            this.hostNode.insertBefore(child, this.hostNode.childNodes[i + workIndex + offset]);
                        }
                        else {
                            this.hostNode.appendChild(child);
                        }
                    }
                    else {
                        throw new Error('not implemented');
                    }
                }
                else {
                    if (child instanceof HTMLElement || child instanceof Text) {
                        if (this.hostNode.childNodes[i + workIndex + offset]) {
                            this.hostNode.insertBefore(child, this.hostNode.childNodes[i + workIndex + offset]);
                        }
                        else {
                            this.hostNode.appendChild(child);
                        }
                    }
                    else {
                        throw new Error('not implemented');
                    }
                }
            }
            while (this.hostNode.childNodes[i + workIndex + offset] !== this.contentEndMarker) {
                this.hostNode.removeChild(this.hostNode.childNodes[i + workIndex + offset]);
            }
        }
    }
    exports.AurumElement = AurumElement;
    AurumElement.id = 1;
    /**
     * @internal
     */
    function render(element, session, prerendering = false) {
        if (element == undefined) {
            return undefined;
        }
        if (exports.pendingSessions.has(element)) {
            const subSession = exports.pendingSessions.get(element);
            if (subSession.sessionToken) {
                session.attachCalls.push(...subSession.attachCalls);
                session.sessionToken.chain(subSession.sessionToken);
                subSession.attachCalls = undefined;
                subSession.sessionToken = undefined;
            }
            exports.pendingSessions.delete(element);
        }
        if (Array.isArray(element)) {
            // Flatten the rendered content into a single array to avoid having to iterate over nested arrays later
            return Array.prototype.concat.apply([], element.map((e) => render(e, session, prerendering)));
        }
        if (!prerendering) {
            if (element instanceof Promise) {
                const ds = new data_source_4.DataSource();
                element.then((val) => {
                    ds.update(val);
                });
                const result = new SingularAurumElement(ds, createAPI(session));
                return result;
            }
            else if (element instanceof data_source_4.DataSource || element instanceof duplex_data_source_2.DuplexDataSource) {
                const result = new SingularAurumElement(element, createAPI(session));
                return result;
            }
            else if (element instanceof data_source_4.ArrayDataSource) {
                const result = new ArrayAurumElement(element, createAPI(session));
                return result;
            }
            const type = typeof element;
            if (type === 'string' || type === 'number' || type === 'bigint' || type === 'boolean') {
                return document.createTextNode(element.toString());
            }
        }
        if (element[exports.aurumElementModelIdentitiy]) {
            const model = element;
            const api = createAPI(session);
            if (!model.isIntrinsic) {
                console.log(`Rendering ${model.name}`);
                api.onAttach(() => {
                    console.log(`Attaching ${model.name}`);
                });
                api.onDetach(() => {
                    console.log(`Detaching ${model.name}`);
                });
            }
            const componentResult = model.factory(model.props || {}, model.children, api);
            return render(componentResult, session, prerendering);
        }
        // Unsupported types are returned as is in hope that a transclusion component will transform it into something compatible
        return element;
    }
    exports.render = render;
    exports.pendingSessions = new WeakMap();
    /**
     * @internal
     */
    function createAPI(session) {
        let token = undefined;
        const api = {
            renderSession: session,
            onAttach: (cb) => {
                session.attachCalls.push(cb);
            },
            onDetach: (cb) => {
                if (!token) {
                    token = new cancellation_token_4.CancellationToken();
                    session.tokens.push(token);
                }
                token.addCancelable(cb);
            },
            onError: (cb) => {
                throw new Error('not implemented');
            },
            get cancellationToken() {
                if (!token) {
                    token = new cancellation_token_4.CancellationToken();
                    session.tokens.push(token);
                }
                return token;
            },
            prerender(target) {
                const subSession = createRenderSession();
                const result = render(target, subSession, true);
                if (Array.isArray(result)) {
                    for (const item of result) {
                        if (typeof item === 'object') {
                            exports.pendingSessions.set(item, subSession);
                        }
                    }
                }
                else {
                    exports.pendingSessions.set(result, subSession);
                }
                return result;
            },
            style(fragments, ...input) {
                const result = new data_source_4.DataSource();
                for (const ins of input) {
                    if (ins instanceof data_source_4.DataSource || ins instanceof duplex_data_source_2.DuplexDataSource || ins instanceof stream_1.Stream) {
                        ins.listen(() => result.update(recompute(fragments, input)), api.cancellationToken);
                    }
                }
                result.update(recompute(fragments, input));
                return result;
            },
            className(data) {
                return classname_1.aurumClassName(data, api.cancellationToken);
            }
        };
        return api;
    }
    exports.createAPI = createAPI;
    function recompute(fragments, input) {
        let result = '';
        for (let i = 0; i < fragments.length; i++) {
            result += fragments[i];
            if (input[i]) {
                if (input[i] instanceof data_source_4.DataSource || input[i] instanceof duplex_data_source_2.DuplexDataSource || input[i] instanceof stream_1.Stream) {
                    result += input[i].value;
                }
                else {
                    result += input[i];
                }
            }
        }
        return result;
    }
    class ArrayAurumElement extends AurumElement {
        constructor(dataSource, api) {
            super(dataSource, api);
            this.renderSessions = new WeakMap();
            this.dataSource = dataSource;
        }
        attachToDom(node, index) {
            super.attachToDom(node, index);
            //@ts-ignore
            this.contentStartMarker.dataSource = this.dataSource;
            //@ts-ignore
            this.contentEndMarker.dataSource = this.dataSource;
        }
        render(dataSource) {
            dataSource.listenAndRepeat((n) => {
                this.handleNewContent(n);
            }, this.api.cancellationToken);
        }
        spliceChildren(index, amount, newItems) {
            let removed;
            if (newItems) {
                removed = this.children.splice(index, amount, newItems);
            }
            else {
                removed = this.children.splice(index, amount);
            }
            for (const item of removed) {
                this.renderSessions.get(item).sessionToken.cancel();
            }
        }
        handleNewContent(change) {
            const ac = [];
            switch (change.operationDetailed) {
                case 'merge':
                    const source = change.previousState.slice();
                    for (let i = 0; i < change.newState.length; i++) {
                        if (this.children.length <= i) {
                            this.children.push(this.renderItem(change.newState[i], ac));
                            source.push(change.newState[i]);
                        }
                        else if (source[i] !== change.newState[i]) {
                            const index = source.indexOf(change.newState[i], i);
                            if (index !== -1) {
                                const a = this.children[i];
                                const b = this.children[index];
                                this.children[i] = b;
                                this.children[index] = a;
                                const c = source[i];
                                const d = source[index];
                                source[i] = d;
                                source[index] = c;
                            }
                            else {
                                this.spliceChildren(i, 0, this.renderItem(change.newState[i], ac));
                                source.splice(i, 0, change.newState[i]);
                            }
                        }
                    }
                    if (this.children.length > change.newState.length) {
                        this.spliceChildren(change.newState.length, this.children.length - change.newState.length);
                    }
                    break;
                case 'remove':
                case 'removeLeft':
                case 'removeRight':
                    this.spliceChildren(change.index, change.count);
                    break;
                case 'append':
                    for (const item of change.items) {
                        const rendered = this.renderItem(item, ac);
                        if (Array.isArray(rendered)) {
                            this.children = this.children.concat(rendered);
                        }
                        else {
                            this.children.push(rendered);
                        }
                    }
                    break;
                case 'replace':
                    const rendered = this.renderItem(change.items[0], ac);
                    if (Array.isArray(rendered)) {
                        throw new Error('illegal state');
                    }
                    else {
                        this.children[change.index] = rendered;
                    }
                    break;
                case 'swap':
                    const itemA = this.children[change.index];
                    const itemB = this.children[change.index2];
                    this.children[change.index2] = itemA;
                    this.children[change.index] = itemB;
                    break;
                case 'prepend':
                    for (let i = change.items.length - 1; i >= 0; i--) {
                        const item = change.items[i];
                        const rendered = this.renderItem(item, ac);
                        if (Array.isArray(rendered)) {
                            throw new Error('illegal state');
                        }
                        else {
                            this.children.unshift(rendered);
                        }
                    }
                    break;
                case 'insert':
                    let index = change.index;
                    for (const item of change.items) {
                        const rendered = this.renderItem(item, ac);
                        if (Array.isArray(rendered)) {
                            throw new Error('illegal state');
                        }
                        else {
                            this.children.splice(index, 0, rendered);
                            index += 1;
                        }
                    }
                    break;
                case 'remove':
                    for (const item of change.items) {
                        const rendered = this.renderItem(item, ac);
                        if (Array.isArray(rendered)) {
                            throw new Error('illegal state');
                        }
                        else {
                            this.children.unshift(rendered);
                        }
                    }
                    break;
                case 'clear':
                    this.children.length = 0;
                    this.renderSessions = new WeakMap();
                    break;
                default:
                    throw new Error('not implemented');
            }
            this.updateDom();
            for (const c of ac) {
                c();
            }
        }
        renderItem(item, attachCalls) {
            if (item === null || item === undefined) {
                return;
            }
            const s = createRenderSession();
            const rendered = render(item, s);
            if (rendered === undefined || rendered === null) {
                return;
            }
            if (rendered instanceof AurumElement) {
                s.sessionToken.addCancelable(() => rendered.dispose());
            }
            this.renderSessions.set(rendered, s);
            attachCalls.push(...s.attachCalls);
            return rendered;
        }
    }
    exports.ArrayAurumElement = ArrayAurumElement;
    class SingularAurumElement extends AurumElement {
        constructor(dataSource, api) {
            super(dataSource, api);
            this.api.cancellationToken.addCancelable(() => { var _a; return (_a = this.renderSession) === null || _a === void 0 ? void 0 : _a.sessionToken.cancel(); });
            this.dataSource = dataSource;
        }
        attachToDom(node, index) {
            super.attachToDom(node, index);
            //@ts-ignore
            this.contentStartMarker.dataSource = this.dataSource;
            //@ts-ignore
            this.contentEndMarker.dataSource = this.dataSource;
        }
        render(dataSource) {
            dataSource.listenAndRepeat((n) => {
                this.handleNewContent(n);
            }, this.api.cancellationToken);
        }
        handleNewContent(newValue) {
            if (this.lastValue === newValue) {
                return;
            }
            let optimized = false;
            if (this.children.length === 1 && this.children[0] instanceof Text) {
                const type = typeof newValue;
                if (type === 'string' || type === 'bigint' || type === 'number' || type === 'boolean') {
                    this.children[0].nodeValue = newValue;
                    optimized = true;
                }
            }
            if (!optimized) {
                this.fullRebuild(newValue);
            }
            this.updateDom();
            for (const cb of this.renderSession.attachCalls) {
                cb();
            }
            this.lastValue = newValue;
        }
        fullRebuild(newValue) {
            this.clearContent();
            this.endSession();
            this.renderSession = createRenderSession();
            let rendered = render(newValue, this.renderSession);
            if (rendered === undefined) {
                this.children = [];
                return;
            }
            if (!Array.isArray(rendered)) {
                rendered = [rendered];
            }
            for (const item of rendered) {
                if (item instanceof AurumElement) {
                    item.attachToDom(this.hostNode, this.getLastIndex());
                    this.renderSession.sessionToken.addCancelable(() => {
                        item.dispose();
                    });
                }
            }
            if (Array.isArray(rendered)) {
                this.children = rendered;
            }
        }
        endSession() {
            if (this.renderSession) {
                this.renderSession.sessionToken.cancel();
                this.renderSession = undefined;
            }
        }
    }
    exports.SingularAurumElement = SingularAurumElement;
});
define("stream/data_source_operators", ["require", "exports", "utilities/event_emitter", "stream/data_source", "stream/stream", "stream/operator_model"], function (require, exports, event_emitter_4, data_source_5, stream_2, operator_model_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dsLoadBalance = exports.dsTap = exports.dsPipeUp = exports.dsPipe = exports.dsPick = exports.dsBuffer = exports.dsThrottle = exports.dsLock = exports.dsSemaphore = exports.dsThrottleFrame = exports.dsDebounce = exports.dsDelay = exports.dsStringJoin = exports.dsReduce = exports.dsAwaitLatest = exports.dsAwaitOrdered = exports.dsAwait = exports.dsUnique = exports.dsCutOffDynamic = exports.dsCutOff = exports.dsSkip = exports.dsSkipDynamic = exports.dsMax = exports.dsMin = exports.dsOdd = exports.dsEven = exports.dsFilterAsync = exports.dsFilter = exports.dsDiff = exports.dsMapAsync = exports.dsMap = void 0;
    function dsMap(mapper) {
        return {
            name: 'map',
            operationType: operator_model_2.OperationType.MAP,
            operation: (v) => mapper(v)
        };
    }
    exports.dsMap = dsMap;
    function dsMapAsync(mapper) {
        return {
            name: 'mapAsync',
            operationType: operator_model_2.OperationType.MAP_DELAY,
            operation: (v) => mapper(v)
        };
    }
    exports.dsMapAsync = dsMapAsync;
    function dsDiff() {
        let lastValue = undefined;
        return {
            name: 'diff',
            operationType: operator_model_2.OperationType.MAP,
            operation: (v) => {
                let result = {
                    oldValue: lastValue,
                    newValue: v
                };
                lastValue = v;
                return result;
            }
        };
    }
    exports.dsDiff = dsDiff;
    function dsFilter(predicate) {
        return {
            name: 'filter',
            operationType: operator_model_2.OperationType.FILTER,
            operation: (v) => predicate(v)
        };
    }
    exports.dsFilter = dsFilter;
    function dsFilterAsync(predicate) {
        return {
            name: 'filterAsync',
            operationType: operator_model_2.OperationType.DELAY_FILTER,
            operation: (v) => predicate(v)
        };
    }
    exports.dsFilterAsync = dsFilterAsync;
    function dsEven() {
        return {
            name: 'even',
            operationType: operator_model_2.OperationType.FILTER,
            operation: (v) => v % 2 === 0
        };
    }
    exports.dsEven = dsEven;
    function dsOdd() {
        return {
            name: 'odd',
            operationType: operator_model_2.OperationType.FILTER,
            operation: (v) => v % 2 !== 0
        };
    }
    exports.dsOdd = dsOdd;
    function dsMin() {
        let last = Number.MAX_SAFE_INTEGER;
        return {
            name: 'min',
            operationType: operator_model_2.OperationType.FILTER,
            operation: (v) => {
                if (v < last) {
                    last = v;
                    return true;
                }
                else {
                    return false;
                }
            }
        };
    }
    exports.dsMin = dsMin;
    function dsMax() {
        let last = Number.MIN_SAFE_INTEGER;
        return {
            name: 'max',
            operationType: operator_model_2.OperationType.FILTER,
            operation: (v) => {
                if (v > last) {
                    last = v;
                    return true;
                }
                else {
                    return false;
                }
            }
        };
    }
    exports.dsMax = dsMax;
    function dsSkipDynamic(amountLeft) {
        return {
            operationType: operator_model_2.OperationType.FILTER,
            name: 'skipDynamic',
            operation: (v) => {
                if (amountLeft.value === 0) {
                    return true;
                }
                else {
                    amountLeft.update(amountLeft.value - 1);
                    return false;
                }
            }
        };
    }
    exports.dsSkipDynamic = dsSkipDynamic;
    function dsSkip(amount) {
        return {
            operationType: operator_model_2.OperationType.FILTER,
            name: `skip ${amount}`,
            operation: (v) => {
                if (amount === 0) {
                    return true;
                }
                else {
                    amount--;
                    return false;
                }
            }
        };
    }
    exports.dsSkip = dsSkip;
    function dsCutOff(amount) {
        return {
            name: `cutoff ${amount}`,
            operationType: operator_model_2.OperationType.FILTER,
            operation: (v) => {
                if (amount === 0) {
                    return false;
                }
                else {
                    amount--;
                    return true;
                }
            }
        };
    }
    exports.dsCutOff = dsCutOff;
    function dsCutOffDynamic(amountLeft) {
        return {
            name: 'cutoffDynamic',
            operationType: operator_model_2.OperationType.FILTER,
            operation: (v) => {
                if (amountLeft.value === 0) {
                    return false;
                }
                else {
                    amountLeft.update(amountLeft.value - 1);
                    return true;
                }
            }
        };
    }
    exports.dsCutOffDynamic = dsCutOffDynamic;
    function dsUnique() {
        let last;
        return {
            name: 'unique',
            operationType: operator_model_2.OperationType.FILTER,
            operation: (v) => {
                if (v === last) {
                    return false;
                }
                else {
                    last = v;
                    return true;
                }
            }
        };
    }
    exports.dsUnique = dsUnique;
    function dsAwait() {
        return {
            name: 'await',
            operationType: operator_model_2.OperationType.MAP_DELAY,
            operation: (v) => {
                return v;
            }
        };
    }
    exports.dsAwait = dsAwait;
    function dsAwaitOrdered() {
        const queue = [];
        const onDequeue = new event_emitter_4.EventEmitter();
        return {
            operationType: operator_model_2.OperationType.MAP_DELAY,
            name: 'awaitOrdered',
            operation: async (v) => {
                queue.push(v);
                if (queue.length === 1) {
                    return processItem();
                }
                else {
                    const unsub = onDequeue.subscribe(async () => {
                        if (queue[0] === v) {
                            unsub.cancel();
                            return processItem();
                        }
                    });
                }
            }
        };
        async function processItem() {
            await queue[0];
            const item = queue.shift();
            onDequeue.fire();
            return item;
        }
    }
    exports.dsAwaitOrdered = dsAwaitOrdered;
    function dsAwaitLatest() {
        let freshnessToken;
        return {
            operationType: operator_model_2.OperationType.MAP_DELAY_FILTER,
            name: 'awaitLatest',
            operation: async (v) => {
                freshnessToken = Date.now();
                const timestamp = freshnessToken;
                const resolved = await v;
                if (freshnessToken === timestamp) {
                    return {
                        item: resolved,
                        cancelled: false
                    };
                }
                else {
                    return {
                        item: undefined,
                        cancelled: true
                    };
                }
            }
        };
    }
    exports.dsAwaitLatest = dsAwaitLatest;
    function dsReduce(reducer, initialValue) {
        let last = initialValue;
        return {
            name: 'reduce',
            operationType: operator_model_2.OperationType.MAP,
            operation: (v) => {
                last = reducer(last, v);
                return last;
            }
        };
    }
    exports.dsReduce = dsReduce;
    function dsStringJoin(seperator = ', ') {
        let last;
        return {
            name: `stringJoin ${seperator}`,
            operationType: operator_model_2.OperationType.MAP,
            operation: (v) => {
                if (last) {
                    last += seperator + v;
                }
                else {
                    last = v;
                }
                return last;
            }
        };
    }
    exports.dsStringJoin = dsStringJoin;
    function dsDelay(time) {
        return {
            name: `delay ${time}ms`,
            operationType: operator_model_2.OperationType.DELAY,
            operation: (v) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(v);
                    }, time);
                });
            }
        };
    }
    exports.dsDelay = dsDelay;
    function dsDebounce(time) {
        let timeout;
        let cancelled = new event_emitter_4.EventEmitter();
        return {
            operationType: operator_model_2.OperationType.DELAY_FILTER,
            name: `debounce ${time}ms`,
            operation: (v) => {
                return new Promise((resolve) => {
                    clearTimeout(timeout);
                    cancelled.fire();
                    cancelled.subscribeOnce(() => {
                        resolve(false);
                    });
                    timeout = setTimeout(() => {
                        resolve(true);
                        cancelled.cancelAll();
                    }, time);
                });
            }
        };
    }
    exports.dsDebounce = dsDebounce;
    /**
     * Debounce update to occur at most one per animation frame
     */
    function dsThrottleFrame() {
        let timeout;
        let cancelled = new event_emitter_4.EventEmitter();
        return {
            operationType: operator_model_2.OperationType.DELAY_FILTER,
            name: `throttle frame`,
            operation: (v) => {
                return new Promise((resolve) => {
                    clearTimeout(timeout);
                    cancelled.fire();
                    cancelled.subscribeOnce(() => {
                        resolve(false);
                    });
                    timeout = requestAnimationFrame(() => {
                        resolve(true);
                        cancelled.cancelAll();
                    });
                });
            }
        };
    }
    exports.dsThrottleFrame = dsThrottleFrame;
    function dsSemaphore(state) {
        return {
            operationType: operator_model_2.OperationType.DELAY,
            name: 'semaphore',
            operation: (v) => {
                return new Promise((resolve) => {
                    if (state.value > 0) {
                        state.update(state.value - 1);
                        resolve(v);
                    }
                    else {
                        const cancel = state.listen(() => {
                            if (state.value > 0) {
                                cancel();
                                state.update(state.value - 1);
                                resolve(v);
                            }
                        });
                    }
                });
            }
        };
    }
    exports.dsSemaphore = dsSemaphore;
    function dsLock(state) {
        return {
            name: 'lock',
            operationType: operator_model_2.OperationType.DELAY,
            operation: (v) => {
                return new Promise((resolve) => {
                    if (state.value) {
                        resolve(v);
                    }
                    else {
                        const cancel = state.listen(() => {
                            if (state.value) {
                                cancel();
                                resolve(v);
                            }
                        });
                    }
                });
            }
        };
    }
    exports.dsLock = dsLock;
    function dsThrottle(time) {
        let cooldown = false;
        return {
            name: `throttle ${time}ms`,
            operationType: operator_model_2.OperationType.FILTER,
            operation: (v) => {
                if (!cooldown) {
                    cooldown = true;
                    setTimeout(() => {
                        cooldown = false;
                    }, time);
                    return true;
                }
                else {
                    return false;
                }
            }
        };
    }
    exports.dsThrottle = dsThrottle;
    function dsBuffer(time) {
        let buffer = [];
        let promise;
        return {
            name: `buffer ${time}ms`,
            operationType: operator_model_2.OperationType.MAP_DELAY_FILTER,
            operation: (v) => {
                buffer.push(v);
                if (!promise) {
                    promise = new Promise((resolve) => {
                        setTimeout(() => {
                            promise = undefined;
                            resolve({
                                cancelled: false,
                                item: buffer
                            });
                            buffer = [];
                        }, time);
                    });
                    return promise;
                }
                else {
                    return Promise.resolve({
                        cancelled: true,
                        item: undefined
                    });
                }
            }
        };
    }
    exports.dsBuffer = dsBuffer;
    function dsPick(key) {
        return {
            name: `pick ${key}`,
            operationType: operator_model_2.OperationType.MAP,
            operation: (v) => {
                if (v !== undefined && v !== null) {
                    return v[key];
                }
                else {
                    return v;
                }
            }
        };
    }
    exports.dsPick = dsPick;
    function dsPipe(target) {
        return {
            name: `pipe ${target.name}`,
            operationType: operator_model_2.OperationType.NOOP,
            operation: (v) => {
                if (target instanceof data_source_5.DataSource || target instanceof stream_2.Stream) {
                    target.update(v);
                }
                else {
                    target.updateDownstream(v);
                }
                return v;
            }
        };
    }
    exports.dsPipe = dsPipe;
    /**
     * Same as pipe except for duplex data sources it pipes upstream
     */
    function dsPipeUp(target) {
        return {
            name: `pipeup ${target.name}`,
            operationType: operator_model_2.OperationType.NOOP,
            operation: (v) => {
                if (target instanceof data_source_5.DataSource || target instanceof stream_2.Stream) {
                    target.update(v);
                }
                else {
                    target.updateUpstream(v);
                }
                return v;
            }
        };
    }
    exports.dsPipeUp = dsPipeUp;
    function dsTap(cb) {
        return {
            name: 'tap',
            operationType: operator_model_2.OperationType.NOOP,
            operation: (v) => {
                cb(v);
                return v;
            }
        };
    }
    exports.dsTap = dsTap;
    function dsLoadBalance(targets) {
        let i = 0;
        return {
            name: `loadBalance [${targets.map((v) => v.name).join()}]`,
            operationType: operator_model_2.OperationType.NOOP,
            operation: (v) => {
                const target = targets[i++];
                if (i >= targets.length) {
                    i = 0;
                }
                if (target instanceof data_source_5.DataSource || target instanceof stream_2.Stream) {
                    target.update(v);
                }
                else {
                    target.updateDownstream(v);
                }
                return v;
            }
        };
    }
    exports.dsLoadBalance = dsLoadBalance;
});
define("nodes/dom_adapter", ["require", "exports", "stream/data_source", "stream/duplex_data_source", "rendering/aurum_element", "stream/data_source_operators"], function (require, exports, data_source_6, duplex_data_source_3, aurum_element_1, data_source_operators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createEventHandlers = exports.processHTMLNode = exports.DomNodeCreator = exports.defaultAttributes = exports.defaultEvents = void 0;
    /**
     * @internal
     */
    exports.defaultEvents = {
        drag: 'onDrag',
        dragstart: 'onDragStart',
        dragend: 'onDragEnd',
        dragexit: 'onDragExit',
        dragover: 'onDragOver',
        dragenter: 'onDragEnter',
        dragleave: 'onDragLeave',
        blur: 'onBlur',
        focus: 'onFocus',
        click: 'onClick',
        dblclick: 'onDblClick',
        keydown: 'onKeyDown',
        keyhit: 'onKeyHit',
        keyup: 'onKeyUp',
        mousedown: 'onMouseDown',
        mouseup: 'onMouseUp',
        mousemove: 'onMouseMove',
        mouseenter: 'onMouseEnter',
        mouseleave: 'onMouseLeave',
        mousewheel: 'onMouseWheel',
        load: 'onLoad',
        error: 'onError'
    };
    /**
     * @internal
     */
    exports.defaultAttributes = ['id', 'name', 'draggable', 'tabindex', 'style', 'role', 'contentEditable', 'slot', 'title'];
    function DomNodeCreator(nodeName, extraAttributes, extraEvents, extraLogic) {
        return function (props, children, api) {
            const node = document.createElement(nodeName);
            if (props) {
                processHTMLNode(node, props, api.cancellationToken, extraAttributes, extraEvents);
            }
            //@ts-ignore
            const renderedChildren = aurum_element_1.render(children, api.renderSession);
            connectChildren(node, renderedChildren);
            if (props.onAttach) {
                api.onAttach(() => props.onAttach(node));
            }
            if (props.onDetach) {
                api.onDetach(() => {
                    if (node.isConnected) {
                        node.parentElement.removeChild(node);
                    }
                    props.onDetach(node);
                });
            }
            extraLogic === null || extraLogic === void 0 ? void 0 : extraLogic(node, props, api.cancellationToken);
            return node;
        };
    }
    exports.DomNodeCreator = DomNodeCreator;
    function connectChildren(target, children) {
        if (children === undefined || children === null) {
            return;
        }
        if (Array.isArray(children)) {
            for (const child of children) {
                connectChildren(target, child);
            }
            return;
        }
        if (children instanceof aurum_element_1.AurumElement) {
            children.attachToDom(target, target.childNodes.length);
        }
        else if (children instanceof HTMLElement || children instanceof Text) {
            target.appendChild(children);
        }
        else {
            throw new Error(`Unexpected child type passed to DOM Node: ${children}`);
        }
    }
    function processHTMLNode(node, props, cleanUp, extraAttributes, extraEvents) {
        createEventHandlers(node, exports.defaultEvents, props);
        if (extraEvents) {
            createEventHandlers(node, extraEvents, props);
        }
        const dataProps = Object.keys(props).filter((e) => e.includes('-'));
        bindProps(node, exports.defaultAttributes, props, cleanUp, dataProps);
        if (extraAttributes) {
            bindProps(node, extraAttributes, props, cleanUp);
        }
        if (props.class) {
            handleClass(node, props.class, cleanUp);
        }
    }
    exports.processHTMLNode = processHTMLNode;
    function createEventHandlers(node, events, props) {
        for (const key in events) {
            if (props[events[key]]) {
                if (props[events[key]] instanceof data_source_6.DataSource) {
                    //@ts-ignore
                    node.addEventListener(key, (e) => props[events[key]].update(e));
                }
                else if (props[events[key]] instanceof duplex_data_source_3.DuplexDataSource) {
                    //@ts-ignore
                    node.addEventListener(key, (e) => props[events[key]].updateDownstream(e));
                }
                else if (typeof props[events[key]] === 'function') {
                    //@ts-ignore
                    node.addEventListener(key, (e) => props[events[key]](e));
                }
            }
        }
    }
    exports.createEventHandlers = createEventHandlers;
    function bindProps(node, keys, props, cleanUp, dynamicProps) {
        for (const key of keys) {
            if (props[key]) {
                assignStringSourceToAttribute(node, props[key], key, cleanUp);
            }
        }
        if (dynamicProps) {
            for (const key of dynamicProps) {
                if (props[key]) {
                    assignStringSourceToAttribute(node, props[key], key, cleanUp);
                }
            }
        }
    }
    function assignStringSourceToAttribute(node, data, key, cleanUp) {
        if (typeof data === 'string') {
            node.setAttribute(key, data);
        }
        else if (typeof data === 'boolean') {
            if (data) {
                node.setAttribute(key, '');
            }
        }
        else if (data instanceof data_source_6.DataSource || data instanceof duplex_data_source_3.DuplexDataSource) {
            if (typeof data.value === 'string') {
                node.setAttribute(key, data.value);
            }
            else if (typeof data.value === 'boolean') {
                if (data.value) {
                    node.setAttribute(key, '');
                }
            }
            data.transform(data_source_operators_1.dsUnique(), cleanUp).listen((v) => {
                if (typeof v === 'string') {
                    node.setAttribute(key, v);
                }
                else if (typeof v === 'boolean') {
                    if (v) {
                        node.setAttribute(key, '');
                    }
                    else {
                        node.removeAttribute(key);
                    }
                }
            });
        }
        else {
            throw new Error('Attributes only support types boolean, string, number and data sources');
        }
    }
    function handleClass(node, data, cleanUp) {
        if (typeof data === 'string') {
            node.className = data;
        }
        else if (data instanceof data_source_6.DataSource || data instanceof duplex_data_source_3.DuplexDataSource) {
            if (data.value) {
                if (Array.isArray(data.value)) {
                    node.className = data.value.join(' ');
                    data.transform(data_source_operators_1.dsUnique(), cleanUp).listen(() => {
                        node.className = data.value.join(' ');
                    });
                }
                else {
                    node.className = data.value;
                    data.transform(data_source_operators_1.dsUnique(), cleanUp).listen(() => {
                        node.className = data.value;
                    });
                }
            }
            data.transform(data_source_operators_1.dsUnique(), cleanUp).listen((v) => (node.className = v));
        }
        else {
            const value = data.reduce((p, c) => {
                if (typeof c === 'string') {
                    return `${p} ${c}`;
                }
                else {
                    if (c.value) {
                        return `${p} ${c.value}`;
                    }
                    else {
                        return p;
                    }
                }
            }, '');
            node.className = value;
            for (const i of data) {
                if (i instanceof data_source_6.DataSource) {
                    i.transform(data_source_operators_1.dsUnique(), cleanUp).listen((v) => {
                        const value = data.reduce((p, c) => {
                            if (typeof c === 'string') {
                                return `${p} ${c}`;
                            }
                            else {
                                if (c.value) {
                                    return `${p} ${c.value}`;
                                }
                                else {
                                    return p;
                                }
                            }
                        }, '');
                        node.className = value;
                    });
                }
            }
        }
    }
});
define("nodes/input", ["require", "exports", "nodes/dom_adapter", "stream/data_source", "stream/duplex_data_source"], function (require, exports, dom_adapter_1, data_source_7, duplex_data_source_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Input = void 0;
    /**
     * @internal
     */
    const inputEvents = { input: 'onInput', change: 'onChange' };
    /**
     * @internal
     */
    const inputProps = [
        'placeholder',
        'readonly',
        'disabled',
        'accept',
        'alt',
        'autocomplete',
        'autofocus',
        'checked',
        'defaultChecked',
        'formAction',
        'formEnctype',
        'formMethod',
        'formNoValidate',
        'formTarget',
        'max',
        'maxLength',
        'min',
        'minLength',
        'pattern',
        'multiple',
        'required',
        'type'
    ];
    /**
     * @internal
     */
    exports.Input = dom_adapter_1.DomNodeCreator('input', inputProps, inputEvents, (node, props, cleanUp) => {
        const input = node;
        if (props.value) {
            if (props.value instanceof data_source_7.DataSource) {
                props.value.listenAndRepeat((v) => {
                    input.value = v;
                }, cleanUp);
                input.addEventListener('input', () => {
                    props.value.update(input.value);
                });
            }
            else if (props.value instanceof duplex_data_source_4.DuplexDataSource) {
                props.value.listenAndRepeat((v) => {
                    input.value = v;
                }, cleanUp);
                input.addEventListener('input', () => {
                    props.value.updateUpstream(input.value);
                });
            }
            else {
                input.value = props.value;
            }
        }
        if (props.checked) {
            if (props.checked instanceof data_source_7.DataSource) {
                props.checked.listenAndRepeat((v) => {
                    input.checked = v;
                }, cleanUp);
                input.addEventListener('change', () => {
                    props.checked.update(input.checked);
                });
            }
            else if (props.checked instanceof duplex_data_source_4.DuplexDataSource) {
                props.checked.listenAndRepeat((v) => {
                    input.checked = v;
                }, cleanUp);
                input.addEventListener('change', () => {
                    props.checked.updateUpstream(input.checked);
                });
            }
            else {
                input.checked = props.checked;
            }
        }
    });
});
define("nodes/select", ["require", "exports", "stream/data_source", "stream/duplex_data_source", "nodes/dom_adapter"], function (require, exports, data_source_8, duplex_data_source_5, dom_adapter_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Select = void 0;
    /**
     * @internal
     */
    const selectEvents = { change: 'onChange' };
    /**
     * @internal
     */
    exports.Select = dom_adapter_2.DomNodeCreator('select', undefined, selectEvents, (node, props, cleanUp) => {
        const select = node;
        if (props.value) {
            if (props.value instanceof data_source_8.DataSource) {
                props.value.listenAndRepeat((v) => {
                    select.value = v;
                }, cleanUp);
                select.addEventListener('change', () => {
                    props.value.update(select.value);
                });
            }
            else if (props.value instanceof duplex_data_source_5.DuplexDataSource) {
                props.value.listenAndRepeat((v) => {
                    select.value = v;
                }, cleanUp);
                select.addEventListener('change', () => {
                    props.value.updateUpstream(select.value);
                });
            }
            else {
                select.value = props.value;
            }
        }
        if (props.selectedIndex) {
            if (props.selectedIndex instanceof data_source_8.DataSource) {
                props.selectedIndex.listenAndRepeat((v) => {
                    select.selectedIndex = v;
                }, cleanUp);
                select.addEventListener('change', () => {
                    props.selectedIndex.update(select.selectedIndex);
                });
            }
            else if (props.selectedIndex instanceof duplex_data_source_5.DuplexDataSource) {
                props.selectedIndex.listenAndRepeat((v) => {
                    select.selectedIndex = v;
                }, cleanUp);
                select.addEventListener('change', () => {
                    props.selectedIndex.updateUpstream(select.selectedIndex);
                });
            }
            else {
                select.selectedIndex = props.selectedIndex;
            }
        }
    });
});
define("nodes/simple_dom_nodes", ["require", "exports", "nodes/dom_adapter"], function (require, exports, dom_adapter_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Slot = exports.Option = exports.Progress = exports.Svg = exports.Script = exports.Source = exports.Style = exports.Time = exports.Th = exports.Td = exports.TFoot = exports.TBody = exports.Table = exports.Sup = exports.Sub = exports.Nav = exports.Link = exports.Label = exports.Img = exports.IFrame = exports.I = exports.Heading = exports.Header = exports.Head = exports.Form = exports.Footer = exports.Em = exports.Details = exports.Data = exports.Canvas = exports.Button = exports.Br = exports.Audio = exports.Hr = exports.P = exports.Pre = exports.Q = exports.Template = exports.THead = exports.Summary = exports.Title = exports.Body = exports.B = exports.Tr = exports.Li = exports.Ol = exports.Ul = exports.Video = exports.NoScript = exports.Span = exports.Aside = exports.Article = exports.Area = exports.H6 = exports.H5 = exports.H4 = exports.H3 = exports.H2 = exports.H1 = exports.Address = exports.Abbr = exports.A = exports.Div = exports.Code = void 0;
    /**
     * @internal
     */
    exports.Code = dom_adapter_3.DomNodeCreator('code');
    /**
     * @internal
     */
    exports.Div = dom_adapter_3.DomNodeCreator('div');
    /**
     * @internal
     */
    exports.A = dom_adapter_3.DomNodeCreator('a', ['href', 'target']);
    /**
     * @internal
     */
    exports.Abbr = dom_adapter_3.DomNodeCreator('abbr');
    /**
     * @internal
     */
    exports.Address = dom_adapter_3.DomNodeCreator('address');
    /**
     * @internal
     */
    exports.H1 = dom_adapter_3.DomNodeCreator('h1');
    /**
     * @internal
     */
    exports.H2 = dom_adapter_3.DomNodeCreator('h2');
    /**
     * @internal
     */
    exports.H3 = dom_adapter_3.DomNodeCreator('h3');
    /**
     * @internal
     */
    exports.H4 = dom_adapter_3.DomNodeCreator('h4');
    /**
     * @internal
     */
    exports.H5 = dom_adapter_3.DomNodeCreator('h5');
    /**
     * @internal
     */
    exports.H6 = dom_adapter_3.DomNodeCreator('h6');
    /**
     * @internal
     */
    exports.Area = dom_adapter_3.DomNodeCreator('area', ['alt', 'coors']);
    /**
     * @internal
     */
    exports.Article = dom_adapter_3.DomNodeCreator('article');
    /**
     * @internal
     */
    exports.Aside = dom_adapter_3.DomNodeCreator('aside');
    /**
     * @internal
     */
    exports.Span = dom_adapter_3.DomNodeCreator('span');
    /**
     * @internal
     */
    exports.NoScript = dom_adapter_3.DomNodeCreator('noscript');
    /**
     * @internal
     */
    exports.Video = dom_adapter_3.DomNodeCreator('video', ['controls', 'autoplay', 'loop', 'muted', 'preload', 'src', 'poster', 'width', 'height']);
    /**
     * @internal
     */
    exports.Ul = dom_adapter_3.DomNodeCreator('ul');
    /**
     * @internal
     */
    exports.Ol = dom_adapter_3.DomNodeCreator('ol');
    /**
     * @internal
     */
    exports.Li = dom_adapter_3.DomNodeCreator('li');
    /**
     * @internal
     */
    exports.Tr = dom_adapter_3.DomNodeCreator('tr');
    /**
     * @internal
     */
    exports.B = dom_adapter_3.DomNodeCreator('b');
    /**
     * @internal
     */
    exports.Body = dom_adapter_3.DomNodeCreator('body');
    /**
     * @internal
     */
    exports.Title = dom_adapter_3.DomNodeCreator('title');
    /**
     * @internal
     */
    exports.Summary = dom_adapter_3.DomNodeCreator('summary');
    /**
     * @internal
     */
    exports.THead = dom_adapter_3.DomNodeCreator('thead');
    /**
     * @internal
     */
    exports.Template = dom_adapter_3.DomNodeCreator('template');
    /**
     * @internal
     */
    exports.Q = dom_adapter_3.DomNodeCreator('q');
    /**
     * @internal
     */
    exports.Pre = dom_adapter_3.DomNodeCreator('pre');
    /**
     * @internal
     */
    exports.P = dom_adapter_3.DomNodeCreator('p');
    /**
     * @internal
     */
    exports.Hr = dom_adapter_3.DomNodeCreator('hr');
    /**
     * @internal
     */
    exports.Audio = dom_adapter_3.DomNodeCreator('audio', ['controls', 'autoplay', 'loop', 'muted', 'preload', 'src']);
    /**
     * @internal
     */
    exports.Br = dom_adapter_3.DomNodeCreator('br');
    /**
     * @internal
     */
    exports.Button = dom_adapter_3.DomNodeCreator('button', ['disabled']);
    /**
     * @internal
     */
    exports.Canvas = dom_adapter_3.DomNodeCreator('canvas', ['width', 'height']);
    /**
     * @internal
     */
    exports.Data = dom_adapter_3.DomNodeCreator('data', ['value']);
    /**
     * @internal
     */
    exports.Details = dom_adapter_3.DomNodeCreator('details');
    /**
     * @internal
     */
    exports.Em = dom_adapter_3.DomNodeCreator('em');
    /**
     * @internal
     */
    exports.Footer = dom_adapter_3.DomNodeCreator('footer');
    /**
     * @internal
     */
    exports.Form = dom_adapter_3.DomNodeCreator('form');
    /**
     * @internal
     */
    exports.Head = dom_adapter_3.DomNodeCreator('head');
    /**
     * @internal
     */
    exports.Header = dom_adapter_3.DomNodeCreator('header');
    /**
     * @internal
     */
    exports.Heading = dom_adapter_3.DomNodeCreator('heading');
    /**
     * @internal
     */
    exports.I = dom_adapter_3.DomNodeCreator('i');
    /**
     * @internal
     */
    exports.IFrame = dom_adapter_3.DomNodeCreator('iframe', ['src', 'srcdoc', 'width', 'height', 'allow', 'allowFullscreen', 'allowPaymentRequest']);
    /**
     * @internal
     */
    exports.Img = dom_adapter_3.DomNodeCreator('img', ['src', 'alt', 'width', 'height', 'referrerPolicy', 'sizes', 'srcset', 'useMap']);
    /**
     * @internal
     */
    exports.Label = dom_adapter_3.DomNodeCreator('label', ['for']);
    /**
     * @internal
     */
    exports.Link = dom_adapter_3.DomNodeCreator('link', ['href', 'rel', 'media', 'as', 'disabled', 'type']);
    /**
     * @internal
     */
    exports.Nav = dom_adapter_3.DomNodeCreator('nav');
    /**
     * @internal
     */
    exports.Sub = dom_adapter_3.DomNodeCreator('sub');
    /**
     * @internal
     */
    exports.Sup = dom_adapter_3.DomNodeCreator('sup');
    /**
     * @internal
     */
    exports.Table = dom_adapter_3.DomNodeCreator('table');
    /**
     * @internal
     */
    exports.TBody = dom_adapter_3.DomNodeCreator('tbody');
    /**
     * @internal
     */
    exports.TFoot = dom_adapter_3.DomNodeCreator('tfoot');
    /**
     * @internal
     */
    exports.Td = dom_adapter_3.DomNodeCreator('td');
    /**
     * @internal
     */
    exports.Th = dom_adapter_3.DomNodeCreator('th');
    /**
     * @internal
     */
    exports.Time = dom_adapter_3.DomNodeCreator('time', ['datetime']);
    /**
     * @internal
     */
    exports.Style = dom_adapter_3.DomNodeCreator('style', ['media']);
    /**
     * @internal
     */
    exports.Source = dom_adapter_3.DomNodeCreator('source', ['src', 'srcSet', 'media', 'sizes', 'type']);
    /**
     * @internal
     */
    exports.Script = dom_adapter_3.DomNodeCreator('script', ['src', 'async', 'defer', 'integrity', 'noModule', 'type']);
    /**
     * @internal
     */
    exports.Svg = dom_adapter_3.DomNodeCreator('svg', ['width', 'height']);
    /**
     * @internal
     */
    exports.Progress = dom_adapter_3.DomNodeCreator('progress', ['max', 'value']);
    /**
     * @internal
     */
    exports.Option = dom_adapter_3.DomNodeCreator('option', ['value']);
    /**
     * @internal
     */
    exports.Slot = dom_adapter_3.DomNodeCreator('slot', ['name']);
});
define("nodes/textarea", ["require", "exports", "stream/data_source", "nodes/dom_adapter", "stream/duplex_data_source"], function (require, exports, data_source_9, dom_adapter_4, duplex_data_source_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextArea = void 0;
    /**
     * @internal
     */
    const textAreaEvents = { input: 'onInput', change: 'onChange' };
    /**
     * @internal
     */
    const textAreaProps = [
        'placeholder',
        'readonly',
        'disabled',
        'rows',
        'wrap',
        'autocomplete',
        'autofocus',
        'max',
        'maxLength',
        'min',
        'minLength',
        'required',
        'type'
    ];
    /**
     * @internal
     */
    exports.TextArea = dom_adapter_4.DomNodeCreator('textArea', textAreaProps, textAreaEvents, (node, props, cleanUp) => {
        const textArea = node;
        if (props.value) {
            if (props.value instanceof data_source_9.DataSource) {
                props.value.listenAndRepeat((v) => {
                    textArea.value = v;
                }, cleanUp);
                textArea.addEventListener('input', () => {
                    props.value.update(textArea.value);
                });
            }
            else if (props.value instanceof duplex_data_source_6.DuplexDataSource) {
                props.value.listenAndRepeat((v) => {
                    textArea.value = v;
                }, cleanUp);
                textArea.addEventListener('input', () => {
                    props.value.updateUpstream(textArea.value);
                });
            }
            else {
                textArea.value = props.value;
            }
        }
    });
});
define("utilities/aurum", ["require", "exports", "nodes/input", "nodes/select", "nodes/simple_dom_nodes", "nodes/textarea", "rendering/aurum_element", "stream/data_source"], function (require, exports, input_1, select_1, simple_dom_nodes_1, textarea_1, aurum_element_2, data_source_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Aurum = void 0;
    const nodeMap = {
        button: simple_dom_nodes_1.Button,
        code: simple_dom_nodes_1.Code,
        hr: simple_dom_nodes_1.Hr,
        div: simple_dom_nodes_1.Div,
        input: input_1.Input,
        li: simple_dom_nodes_1.Li,
        span: simple_dom_nodes_1.Span,
        style: simple_dom_nodes_1.Style,
        ul: simple_dom_nodes_1.Ul,
        p: simple_dom_nodes_1.P,
        img: simple_dom_nodes_1.Img,
        link: simple_dom_nodes_1.Link,
        canvas: simple_dom_nodes_1.Canvas,
        a: simple_dom_nodes_1.A,
        article: simple_dom_nodes_1.Article,
        br: simple_dom_nodes_1.Br,
        form: simple_dom_nodes_1.Form,
        label: simple_dom_nodes_1.Label,
        ol: simple_dom_nodes_1.Ol,
        pre: simple_dom_nodes_1.Pre,
        progress: simple_dom_nodes_1.Progress,
        table: simple_dom_nodes_1.Table,
        td: simple_dom_nodes_1.Td,
        tr: simple_dom_nodes_1.Tr,
        th: simple_dom_nodes_1.Th,
        textarea: textarea_1.TextArea,
        h1: simple_dom_nodes_1.H1,
        h2: simple_dom_nodes_1.H2,
        h3: simple_dom_nodes_1.H3,
        h4: simple_dom_nodes_1.H4,
        h5: simple_dom_nodes_1.H5,
        h6: simple_dom_nodes_1.H6,
        head: simple_dom_nodes_1.Head,
        header: simple_dom_nodes_1.Header,
        footer: simple_dom_nodes_1.Footer,
        nav: simple_dom_nodes_1.Nav,
        b: simple_dom_nodes_1.B,
        i: simple_dom_nodes_1.I,
        script: simple_dom_nodes_1.Script,
        abbr: simple_dom_nodes_1.Abbr,
        area: simple_dom_nodes_1.Area,
        aside: simple_dom_nodes_1.Aside,
        audio: simple_dom_nodes_1.Audio,
        em: simple_dom_nodes_1.Em,
        heading: simple_dom_nodes_1.Heading,
        iframe: simple_dom_nodes_1.IFrame,
        noscript: simple_dom_nodes_1.NoScript,
        option: simple_dom_nodes_1.Option,
        q: simple_dom_nodes_1.Q,
        select: select_1.Select,
        source: simple_dom_nodes_1.Source,
        title: simple_dom_nodes_1.Title,
        video: simple_dom_nodes_1.Video,
        tbody: simple_dom_nodes_1.TBody,
        tfoot: simple_dom_nodes_1.TFoot,
        thead: simple_dom_nodes_1.THead,
        summary: simple_dom_nodes_1.Summary,
        details: simple_dom_nodes_1.Details,
        sub: simple_dom_nodes_1.Sub,
        sup: simple_dom_nodes_1.Sup,
        svg: simple_dom_nodes_1.Svg,
        data: simple_dom_nodes_1.Data,
        time: simple_dom_nodes_1.Time,
        template: simple_dom_nodes_1.Template,
        slot: simple_dom_nodes_1.Slot
    };
    class Aurum {
        static attach(aurumRenderable, dom) {
            const session = aurum_element_2.createRenderSession();
            const content = aurum_element_2.render(aurumRenderable, session);
            if (content instanceof aurum_element_2.AurumElement) {
                content.attachToDom(dom, dom.childNodes.length);
                session.sessionToken.addCancelable(() => content.dispose());
            }
            else if (Array.isArray(content)) {
                const root = new aurum_element_2.ArrayAurumElement(new data_source_10.ArrayDataSource(content), aurum_element_2.createAPI(session));
                session.sessionToken.addCancelable(() => root.dispose());
                root.attachToDom(dom, dom.childNodes.length);
            }
            else {
                dom.appendChild(content);
                session.sessionToken.addCancelable(() => {
                    dom.removeChild(content);
                });
            }
            for (let i = session.attachCalls.length - 1; i >= 0; i--) {
                session.attachCalls[i]();
            }
            return session.sessionToken;
        }
        static factory(node, args, ...innerNodes) {
            let name;
            let intrinsic = false;
            if (typeof node === 'string') {
                intrinsic = true;
                name = node;
                const type = node;
                node = nodeMap[node];
                if (node === undefined) {
                    throw new Error(`Node ${type} does not exist or is not supported`);
                }
            }
            else {
                name = node.name;
            }
            return {
                [aurum_element_2.aurumElementModelIdentitiy]: true,
                name,
                isIntrinsic: intrinsic,
                factory: node,
                props: args,
                children: innerNodes
            };
        }
    }
    exports.Aurum = Aurum;
});
define("rendering/webcomponent", ["require", "exports", "nodes/dom_adapter", "utilities/aurum", "rendering/aurum_element", "stream/data_source"], function (require, exports, dom_adapter_5, aurum_1, aurum_element_3, data_source_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Webcomponent = void 0;
    function Webcomponent(config, logic) {
        customElements.define(config.name, class extends HTMLElement {
            constructor() {
                super();
                if (config.observedAttributes === undefined) {
                    config.observedAttributes = [];
                }
                this.props = {};
                for (const attr of config.observedAttributes) {
                    this.props[attr] = new data_source_11.DataSource();
                }
            }
            static get observedAttributes() {
                return config.observedAttributes;
            }
            attributeChangedCallback(name, oldValue, newValue) {
                if (oldValue !== newValue) {
                    this.props[name].update(newValue);
                }
            }
            connectedCallback() {
                var _a;
                const template = document.createDocumentFragment();
                this.session = aurum_element_3.createRenderSession();
                this.api = aurum_element_3.createAPI(this.session);
                const content = logic(this.props, this.api);
                for (const cb of this.session.attachCalls) {
                    cb();
                }
                aurum_1.Aurum.attach(content, template);
                this.attachShadow({
                    mode: (_a = config.shadowRootMode) !== null && _a !== void 0 ? _a : 'open',
                    delegatesFocus: config.shadowRootDelegatesFocus
                }).appendChild(template);
            }
            disconnectedCallback() {
                this.session.sessionToken.cancel();
            }
        });
        return dom_adapter_5.DomNodeCreator(config.name, config.observedAttributes, undefined, (node, props) => {
            for (const key in props) {
                //@ts-ignore
                if (!(key in node.props)) {
                    //@ts-ignore
                    node.props[key] = props[key];
                }
            }
        });
    }
    exports.Webcomponent = Webcomponent;
});
define("builtin_compoents/router", ["require", "exports", "stream/data_source", "rendering/aurum_element", "stream/data_source_operators"], function (require, exports, data_source_12, aurum_element_4, data_source_operators_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultRoute = exports.Route = exports.AurumRouter = void 0;
    function AurumRouter(props, children, api) {
        children = [].concat.apply([], children.filter((c) => !!c));
        if (children.some((c) => !c[aurum_element_4.aurumElementModelIdentitiy] || !(c.factory === Route || c.factory === DefaultRoute))) {
            throw new Error('Aurum Router only accepts Route and DefaultRoute instances as children');
        }
        if (children.filter((c) => c.factory === DefaultRoute).length > 1) {
            throw new Error('Too many default routes only 0 or 1 allowed');
        }
        const urlDataSource = new data_source_12.DataSource(getUrlPath());
        api.cancellationToken.registerDomEvent(window, 'hashchange', () => {
            urlDataSource.update(getUrlPath());
        });
        return urlDataSource
            .transform(data_source_operators_2.dsUnique(), api.cancellationToken)
            .withInitial(urlDataSource.value)
            .transform(data_source_operators_2.dsMap((p) => selectRoute(p, children)));
    }
    exports.AurumRouter = AurumRouter;
    function getUrlPath() {
        const hash = location.hash.substring(1);
        if (hash.includes('?')) {
            return hash.substring(0, hash.indexOf('?'));
        }
        else if (hash.includes('#')) {
            return hash.substring(0, hash.indexOf('#'));
        }
        else {
            return hash;
        }
    }
    function selectRoute(url, routes) {
        var _a, _b;
        if (url === undefined || url === null) {
            return (_a = routes.find((r) => r.factory === DefaultRoute)) === null || _a === void 0 ? void 0 : _a.children;
        }
        else {
            if (routes.find((r) => { var _a; return ((_a = r.props) === null || _a === void 0 ? void 0 : _a.href) === url; })) {
                return routes.find((r) => { var _a; return ((_a = r.props) === null || _a === void 0 ? void 0 : _a.href) === url; }).children;
            }
            else {
                const segments = url.split('/');
                segments.pop();
                while (segments.length) {
                    const path = segments.join('/');
                    if (routes.find((r) => { var _a; return ((_a = r.props) === null || _a === void 0 ? void 0 : _a.href) === path; })) {
                        return routes.find((r) => { var _a; return ((_a = r.props) === null || _a === void 0 ? void 0 : _a.href) === path; }).children;
                    }
                    segments.pop();
                }
                return (_b = routes.find((r) => r.factory === DefaultRoute)) === null || _b === void 0 ? void 0 : _b.children;
            }
        }
    }
    function Route(props, children) {
        return undefined;
    }
    exports.Route = Route;
    function DefaultRoute(props, children) {
        return undefined;
    }
    exports.DefaultRoute = DefaultRoute;
});
define("builtin_compoents/suspense", ["require", "exports", "stream/data_source", "utilities/cancellation_token"], function (require, exports, data_source_13, cancellation_token_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Suspense = void 0;
    function Suspense(props, children, api) {
        const data = new data_source_13.DataSource(props === null || props === void 0 ? void 0 : props.fallback);
        const cleanUp = new cancellation_token_5.CancellationToken();
        api.onDetach(() => {
            cleanUp.cancel();
        });
        Promise.all(api.prerender(children, cleanUp)).then((res) => {
            if (!cleanUp.isCanceled) {
                data.update(res);
            }
        }, (e) => {
            cleanUp.cancel();
            return Promise.reject(e);
        });
        return data;
    }
    exports.Suspense = Suspense;
});
define("builtin_compoents/switch", ["require", "exports", "rendering/aurum_element", "utilities/cancellation_token", "stream/data_source_operators"], function (require, exports, aurum_element_5, cancellation_token_6, data_source_operators_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultSwitchCase = exports.SwitchCase = exports.Switch = void 0;
    function Switch(props, children, api) {
        children = [].concat.apply([], children.filter((c) => !!c));
        if (children.some((c) => !c[aurum_element_5.aurumElementModelIdentitiy] ||
            !(c.factory === SwitchCase || c.factory === DefaultSwitchCase))) {
            throw new Error('Switch only accepts SwitchCase as children');
        }
        if (children.filter((c) => c.factory === DefaultSwitchCase).length > 1) {
            throw new Error('Too many default switch cases only 0 or 1 allowed');
        }
        const cleanUp = new cancellation_token_6.CancellationToken();
        api.onDetach(() => {
            cleanUp.cancel();
        });
        const u = props.state.transform(data_source_operators_3.dsUnique(), cleanUp);
        return u.withInitial(props.state.value).transform(data_source_operators_3.dsMap((state) => selectCase(state, children)));
    }
    exports.Switch = Switch;
    function selectCase(state, children) {
        var _a, _b, _c;
        return (_b = (_a = children.find((c) => { var _a; return ((_a = c.props) === null || _a === void 0 ? void 0 : _a.when) === state; })) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : (_c = children.find((p) => p.factory === DefaultSwitchCase)) === null || _c === void 0 ? void 0 : _c.children;
    }
    function SwitchCase(props, children) {
        return undefined;
    }
    exports.SwitchCase = SwitchCase;
    function DefaultSwitchCase(props, children) {
        return undefined;
    }
    exports.DefaultSwitchCase = DefaultSwitchCase;
});
define("stream/object_data_source", ["require", "exports", "stream/data_source", "utilities/event_emitter"], function (require, exports, data_source_14, event_emitter_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectDataSource = void 0;
    class ObjectDataSource {
        constructor(initialData) {
            if (initialData) {
                this.data = initialData;
            }
            this.updateEvent = new event_emitter_5.EventEmitter();
            this.updateEventOnKey = new Map();
        }
        /**
         * Creates a datasource for a single key of the object
         * @param key
         * @param cancellationToken
         */
        pick(key, cancellationToken) {
            var _a;
            const subDataSource = new data_source_14.DataSource((_a = this.data) === null || _a === void 0 ? void 0 : _a[key]);
            this.listenOnKey(key, (v) => {
                subDataSource.update(v.newValue);
            }, cancellationToken);
            return subDataSource;
        }
        /**
         * Listen to changes of the object
         */
        listen(callback, cancellationToken) {
            return this.updateEvent.subscribe(callback, cancellationToken).cancel;
        }
        map(mapper) {
            const stateMap = new Map();
            const result = new data_source_14.ArrayDataSource();
            this.listenAndRepeat((change) => {
                if (change.deleted && stateMap.has(change.key)) {
                    const item = stateMap.get(change.key);
                    result.remove(item);
                    stateMap.delete(change.key);
                }
                else if (stateMap.has(change.key)) {
                    const newItem = mapper(change);
                    result.replace(stateMap.get(change.key), newItem);
                    stateMap.set(change.key, newItem);
                }
                else if (!stateMap.has(change.key) && !change.deleted) {
                    const newItem = mapper(change);
                    result.push(newItem);
                    stateMap.set(change.key, newItem);
                }
            });
            return result;
        }
        /**
         * Same as listen but will immediately call the callback with the current value of each key
         */
        listenAndRepeat(callback, cancellationToken) {
            const c = this.updateEvent.subscribe(callback, cancellationToken).cancel;
            for (const key in this.data) {
                callback({
                    key,
                    newValue: this.data[key],
                    oldValue: undefined,
                    deleted: false
                });
            }
            return c;
        }
        /**
         * Same as listenOnKey but will immediately call the callback with the current value first
         */
        listenOnKeyAndRepeat(key, callback, cancellationToken) {
            callback({
                key,
                newValue: this.data[key],
                oldValue: undefined
            });
            return this.listenOnKey(key, callback, cancellationToken);
        }
        /**
         * Listen to changes of a single key of the object
         */
        listenOnKey(key, callback, cancellationToken) {
            if (!this.updateEventOnKey.has(key)) {
                this.updateEventOnKey.set(key, new event_emitter_5.EventEmitter());
            }
            const event = this.updateEventOnKey.get(key);
            return event.subscribe(callback, cancellationToken).cancel;
        }
        /**
         * Returns all the keys of the object in the source
         */
        keys() {
            return Object.keys(this.data);
        }
        /**
         * Returns all the values of the object in the source
         */
        values() {
            return Object.values(this.data);
        }
        /**
         * get the current value of a key of the object
         * @param key
         */
        get(key) {
            return this.data[key];
        }
        /**
         * delete a key from the object
         * @param key
         * @param value
         */
        delete(key) {
            const old = this.data[key];
            delete this.data[key];
            this.updateEvent.fire({ oldValue: old, key, newValue: undefined, deleted: true });
            if (this.updateEventOnKey.has(key)) {
                this.updateEventOnKey.get(key).fire({ oldValue: old, key, newValue: undefined });
            }
        }
        /**
         * set the value for a key of the object
         * @param key
         * @param value
         */
        set(key, value) {
            if (this.data[key] === value) {
                return;
            }
            const old = this.data[key];
            this.data[key] = value;
            this.updateEvent.fire({ oldValue: old, key, newValue: this.data[key] });
            if (this.updateEventOnKey.has(key)) {
                this.updateEventOnKey.get(key).fire({ oldValue: old, key, newValue: this.data[key] });
            }
        }
        /**
         * Merge the key value pairs of an object into this object non recursively
         * @param newData
         */
        assign(newData) {
            if (newData instanceof ObjectDataSource) {
                for (const key of newData.keys()) {
                    this.set(key, newData.data[key]);
                }
            }
            else {
                for (const key of Object.keys(newData)) {
                    this.set(key, newData[key]);
                }
            }
        }
        /**
         * Returns a shallow copy of the object
         */
        toObject() {
            return Object.assign({}, this.data);
        }
        /**
         * Returns a simplified version of this datasource
         */
        toDataSource() {
            const stream = new data_source_14.DataSource(this.data);
            this.listen((s) => {
                stream.update(this.data);
            });
            return stream;
        }
    }
    exports.ObjectDataSource = ObjectDataSource;
});
define("stream/map_data_source", ["require", "exports", "stream/data_source", "utilities/event_emitter"], function (require, exports, data_source_15, event_emitter_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MapDataSource = void 0;
    class MapDataSource {
        constructor(initialData) {
            if (initialData) {
                this.data = initialData;
            }
            this.updateEvent = new event_emitter_6.EventEmitter();
            this.updateEventOnKey = new Map();
        }
        /**
         * Creates a datasource for a single key of the object
         * @param key
         * @param cancellationToken
         */
        pick(key, cancellationToken) {
            const subDataSource = new data_source_15.DataSource(this.data.get(key));
            this.listenOnKey(key, (v) => {
                subDataSource.update(v.newValue);
            }, cancellationToken);
            return subDataSource;
        }
        /**
         * Listen to changes of the object
         */
        listen(callback, cancellationToken) {
            return this.updateEvent.subscribe(callback, cancellationToken).cancel;
        }
        /**
         * Same as listen but will immediately call the callback with the current value of each key
         */
        listenAndRepeat(callback, cancellationToken) {
            const c = this.updateEvent.subscribe(callback, cancellationToken).cancel;
            for (const key of this.data.keys()) {
                callback({
                    key,
                    newValue: this.data.get(key),
                    oldValue: undefined,
                    deleted: false
                });
            }
            return c;
        }
        map(mapper) {
            const stateMap = new Map();
            const result = new data_source_15.ArrayDataSource();
            this.listenAndRepeat((change) => {
                if (change.deleted && stateMap.has(change.key)) {
                    const item = stateMap.get(change.key);
                    result.remove(item);
                    stateMap.delete(change.key);
                }
                else if (stateMap.has(change.key)) {
                    const newItem = mapper(change);
                    result.replace(stateMap.get(change.key), newItem);
                    stateMap.set(change.key, newItem);
                }
                else if (!stateMap.has(change.key) && !change.deleted) {
                    const newItem = mapper(change);
                    result.push(newItem);
                    stateMap.set(change.key, newItem);
                }
            });
            return result;
        }
        /**
         * Same as listenOnKey but will immediately call the callback with the current value first
         */
        listenOnKeyAndRepeat(key, callback, cancellationToken) {
            callback({
                key,
                newValue: this.data.get(key),
                oldValue: undefined
            });
            return this.listenOnKey(key, callback, cancellationToken);
        }
        /**
         * Listen to changes of a single key of the object
         */
        listenOnKey(key, callback, cancellationToken) {
            if (!this.updateEventOnKey.has(key)) {
                this.updateEventOnKey.set(key, new event_emitter_6.EventEmitter());
            }
            const event = this.updateEventOnKey.get(key);
            return event.subscribe(callback, cancellationToken).cancel;
        }
        /**
         * Returns all the keys of the object in the source
         */
        keys() {
            return this.data.keys();
        }
        /**
         * Returns all the values of the object in the source
         */
        values() {
            return this.data.values();
        }
        /**
         * get the current value of a key of the object
         * @param key
         */
        get(key) {
            return this.data.get(key);
        }
        /**
         * check if map has a key
         * @param key
         */
        has(key) {
            return this.data.has(key);
        }
        /**
         * delete a key from the object
         * @param key
         * @param value
         */
        delete(key) {
            const old = this.data.get(key);
            this.data.delete(key);
            this.updateEvent.fire({ oldValue: old, key, newValue: undefined, deleted: true });
            if (this.updateEventOnKey.has(key)) {
                this.updateEventOnKey.get(key).fire({ oldValue: old, key, newValue: undefined });
            }
        }
        /**
         * set the value for a key of the object
         * @param key
         * @param value
         */
        set(key, value) {
            if (this.data.get(key) === value) {
                return;
            }
            const old = this.data.get(key);
            this.data.set(key, value);
            this.updateEvent.fire({ oldValue: old, key, newValue: this.data.get(key) });
            if (this.updateEventOnKey.has(key)) {
                this.updateEventOnKey.get(key).fire({ oldValue: old, key, newValue: this.data.get(key) });
            }
        }
        /**
         * Merge the key value pairs of an object into this object non recursively
         * @param newData
         */
        assign(newData) {
            for (const key of newData.keys()) {
                this.set(key, newData.get(key));
            }
        }
        /**
         * Returns a shallow copy of the map
         */
        toMap() {
            return new Map(this.data.entries());
        }
    }
    exports.MapDataSource = MapDataSource;
});
define("stream/set_data_source", ["require", "exports", "stream/data_source", "utilities/event_emitter"], function (require, exports, data_source_16, event_emitter_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SetDataSource = void 0;
    class SetDataSource {
        constructor(initialData) {
            if (initialData) {
                this.data = initialData;
            }
            this.updateEvent = new event_emitter_7.EventEmitter();
            this.updateEventOnKey = new Map();
        }
        /**
         * Creates a datasource for a single key of the object
         * @param key
         * @param cancellationToken
         */
        pick(key, cancellationToken) {
            const subDataSource = new data_source_16.DataSource(this.data.has(key));
            this.listenOnKey(key, (v) => {
                subDataSource.update(v);
            }, cancellationToken);
            return subDataSource;
        }
        /**
         * Listen to changes of the object
         */
        listen(callback, cancellationToken) {
            return this.updateEvent.subscribe(callback, cancellationToken).cancel;
        }
        /**
         * Same as listen but will immediately call the callback with the current value of each key
         */
        listenAndRepeat(callback, cancellationToken) {
            const c = this.updateEvent.subscribe(callback, cancellationToken).cancel;
            for (const key of this.data.keys()) {
                callback({
                    key,
                    exists: true
                });
            }
            return c;
        }
        /**
         * Same as listenOnKey but will immediately call the callback with the current value first
         */
        listenOnKeyAndRepeat(key, callback, cancellationToken) {
            callback(this.has(key));
            return this.listenOnKey(key, callback, cancellationToken);
        }
        /**
         * Listen to changes of a single key of the object
         */
        listenOnKey(key, callback, cancellationToken) {
            if (!this.updateEventOnKey.has(key)) {
                this.updateEventOnKey.set(key, new event_emitter_7.EventEmitter());
            }
            const event = this.updateEventOnKey.get(key);
            return event.subscribe(callback, cancellationToken).cancel;
        }
        map(mapper) {
            const stateMap = new Map();
            const result = new data_source_16.ArrayDataSource();
            this.listenAndRepeat((change) => {
                if (!change.exists && stateMap.has(change.key)) {
                    const item = stateMap.get(change.key);
                    result.remove(item);
                    stateMap.delete(change.key);
                }
                else if (!stateMap.has(change.key) && change.exists) {
                    const newItem = mapper(change);
                    result.push(newItem);
                    stateMap.set(change.key, newItem);
                }
            });
            return result;
        }
        /**
         * Returns all the keys of the object in the source
         */
        keys() {
            return this.data.keys();
        }
        /**
         * check if map has a key
         * @param key
         */
        has(key) {
            return this.data.has(key);
        }
        /**
         * delete a key from the object
         * @param key
         * @param value
         */
        delete(key) {
            this.data.delete(key);
            this.updateEvent.fire({ key, exists: false });
            if (this.updateEventOnKey.has(key)) {
                this.updateEventOnKey.get(key).fire(false);
            }
        }
        /**
         * set the value for a key of the object
         * @param key
         * @param value
         */
        add(key) {
            if (this.data.has(key)) {
                return;
            }
            this.data.add(key);
            this.updateEvent.fire({ key, exists: true });
            if (this.updateEventOnKey.has(key)) {
                this.updateEventOnKey.get(key).fire(true);
            }
        }
        /**
         * Merge the key value pairs of an object into this object non recursively
         * @param newData
         */
        assign(newData) {
            for (const key of newData.keys()) {
                this.add(key);
            }
        }
        /**
         * Returns a shallow copy of the set
         */
        toSet() {
            return new Set(this.data.keys());
        }
    }
    exports.SetDataSource = SetDataSource;
});
define("aurumjs", ["require", "exports", "rendering/classname", "rendering/webcomponent", "rendering/aurum_element", "builtin_compoents/router", "builtin_compoents/suspense", "builtin_compoents/switch", "stream/data_source", "stream/duplex_data_source", "stream/object_data_source", "stream/map_data_source", "stream/set_data_source", "stream/data_source_operators", "stream/operator_model", "stream/stream", "utilities/aurum", "utilities/cancellation_token", "utilities/event_emitter", "debug_mode"], function (require, exports, classname_2, webcomponent_1, aurum_element_6, router_1, suspense_1, switch_1, data_source_17, duplex_data_source_7, object_data_source_1, map_data_source_1, set_data_source_1, data_source_operators_4, operator_model_3, stream_3, aurum_2, cancellation_token_7, event_emitter_8, debug_mode_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(classname_2, exports);
    __exportStar(webcomponent_1, exports);
    __exportStar(aurum_element_6, exports);
    __exportStar(router_1, exports);
    __exportStar(suspense_1, exports);
    __exportStar(switch_1, exports);
    __exportStar(data_source_17, exports);
    __exportStar(duplex_data_source_7, exports);
    __exportStar(object_data_source_1, exports);
    __exportStar(map_data_source_1, exports);
    __exportStar(set_data_source_1, exports);
    __exportStar(data_source_operators_4, exports);
    __exportStar(operator_model_3, exports);
    __exportStar(stream_3, exports);
    __exportStar(aurum_2, exports);
    __exportStar(cancellation_token_7, exports);
    __exportStar(event_emitter_8, exports);
    Object.defineProperty(exports, "debugMode", { enumerable: true, get: function () { return debug_mode_2.debugMode; } });
    Object.defineProperty(exports, "enableDebugMode", { enumerable: true, get: function () { return debug_mode_2.enableDebugMode; } });
});
//# sourceMappingURL=aurumjs.js.map