define("utilities/common", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("utilities/linkedlist/linked_list_node", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LinkedListNode {
        constructor(data) {
            this.data = data;
        }
        deleteNext() {
            if (this.next) {
                const overNext = this.next.next;
                this.next.next = undefined;
                this.next.previous = undefined;
                this.next = overNext;
                this.next.previous = this;
            }
        }
        deletePrevious() {
            if (this.previous) {
                this.previous = this.previous.previous;
                this.previous.next = undefined;
                this.previous.previous = undefined;
            }
        }
    }
    exports.LinkedListNode = LinkedListNode;
});
define("utilities/linkedlist/linked_list", ["require", "exports", "utilities/linkedlist/linked_list_node"], function (require, exports, linked_list_node_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LinkedList {
        constructor(data = []) {
            this.length = 0;
            data.forEach((d) => this.append(d));
        }
        find(predicate) {
            let ptr = this.rootNode;
            while (ptr && !predicate(ptr)) {
                ptr = ptr.next;
            }
            return ptr;
        }
        append(element) {
            if (!this.rootNode && !this.lastNode) {
                this.rootNode = this.lastNode = new linked_list_node_1.LinkedListNode(element);
            }
            else {
                this.lastNode.next = new linked_list_node_1.LinkedListNode(element);
                this.lastNode.next.previous = this.lastNode;
                this.lastNode = this.lastNode.next;
            }
            this.length++;
            return element;
        }
        forEach(cb) {
            this.find((n) => {
                cb(n.data);
                return false;
            });
        }
        prepend(element) {
            if (!this.rootNode && !this.lastNode) {
                this.rootNode = this.lastNode = new linked_list_node_1.LinkedListNode(element);
            }
            else {
                this.rootNode.previous = new linked_list_node_1.LinkedListNode(element);
                this.rootNode.previous.next = this.rootNode;
                this.rootNode = this.rootNode.previous;
            }
            this.length++;
            return element;
        }
        remove(element) {
            if (element === this.rootNode.data) {
                this.rootNode = this.rootNode.next;
                this.length--;
            }
            else {
                const result = this.find((e) => e.next && e.next.data === element);
                if (result) {
                    if (result.next === this.lastNode) {
                        this.lastNode = result;
                    }
                    result.deleteNext();
                    this.length--;
                }
            }
        }
    }
    exports.LinkedList = LinkedList;
});
define("utilities/cancellation_token", ["require", "exports", "utilities/linkedlist/linked_list"], function (require, exports, linked_list_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CancellationToken {
        constructor(...cancellables) {
            this.cancelables = new linked_list_1.LinkedList(cancellables);
            this._isCancelled = false;
        }
        get isCanceled() {
            return this._isCancelled;
        }
        addCancelable(delegate) {
            this.throwIfCancelled('attempting to add cancellable to token that is already cancelled');
            this.cancelables.append(delegate);
            if (this.cancelables.length > 200) {
                console.log('potential memory leak: cancellation token has over 200 clean up calls');
            }
            return this;
        }
        removeCancelable(delegate) {
            this.throwIfCancelled('attempting to remove cancellable from token that is already cancelled');
            this.cancelables.remove(delegate);
            return this;
        }
        addDisposable(disposable) {
            this.addCancelable(() => disposable.dispose());
            return this;
        }
        callIfNotCancelled(action) {
            if (!this.isCanceled) {
                action();
            }
        }
        setTimeout(cb, time = 0) {
            const id = setTimeout(cb, time);
            this.addCancelable(() => clearTimeout(id));
        }
        setInterval(cb, time) {
            const id = setInterval(cb, time);
            this.addCancelable(() => clearInterval(id));
        }
        requestAnimationFrame(cb) {
            const id = requestAnimationFrame(cb);
            this.addCancelable(() => cancelAnimationFrame(id));
        }
        animationLoop(cb) {
            let id = requestAnimationFrame(function f(time) {
                cb(time);
                id = requestAnimationFrame(f);
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
        registerDomEvent(eventEmitter, event, callback) {
            eventEmitter.addEventListener(event, callback);
            this.addCancelable(() => eventEmitter.removeEventListener(event, callback));
            return this;
        }
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
define("stream/event_emitter", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EventEmitter {
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
    exports.EventEmitter = EventEmitter;
});
define("stream/data_source", ["require", "exports", "stream/event_emitter"], function (require, exports, event_emitter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DataSource {
        constructor(initialValue) {
            this.value = initialValue;
            this.listeners = [];
        }
        update(newValue) {
            this.value = newValue;
            for (const l of this.listeners) {
                l(newValue);
            }
        }
        listen(callback, cancellationToken) {
            var _a;
            this.listeners.push(callback);
            const cancel = () => {
                const index = this.listeners.indexOf(callback);
                if (index !== -1) {
                    this.listeners.splice(index, 1);
                }
            };
            (_a = cancellationToken) === null || _a === void 0 ? void 0 : _a.addCancelable(() => {
                cancel();
            });
            return cancel;
        }
        filter(callback, cancellationToken) {
            const filteredSource = new DataSource();
            this.listen((value) => {
                if (callback(value)) {
                    filteredSource.update(value);
                }
            }, cancellationToken);
            return filteredSource;
        }
        pipe(targetDataSource, cancellationToken) {
            this.listen((v) => targetDataSource.update(v), cancellationToken);
        }
        map(callback, cancellationToken) {
            const mappedSource = new DataSource(callback(this.value));
            this.listen((value) => {
                mappedSource.update(callback(value));
            }, cancellationToken);
            return mappedSource;
        }
        unique(cancellationToken) {
            const uniqueSource = new DataSource(this.value);
            this.listen((value) => {
                if (value !== uniqueSource.value) {
                    uniqueSource.update(value);
                }
            }, cancellationToken);
            return uniqueSource;
        }
        reduce(reducer, initialValue, cancellationToken) {
            const reduceSource = new DataSource(initialValue);
            this.listen((v) => reduceSource.update(reducer(reduceSource.value, v)), cancellationToken);
            return reduceSource;
        }
        aggregate(otherSource, combinator, cancellationToken) {
            const aggregatedSource = new DataSource(combinator(this.value, otherSource.value));
            this.listen(() => aggregatedSource.update(combinator(this.value, otherSource.value)), cancellationToken);
            otherSource.listen(() => aggregatedSource.update(combinator(this.value, otherSource.value)), cancellationToken);
            return aggregatedSource;
        }
        combine(otherSource, cancellationToken) {
            const combinedDataSource = new DataSource();
            this.pipe(combinedDataSource, cancellationToken);
            otherSource.pipe(combinedDataSource, cancellationToken);
            return combinedDataSource;
        }
        debounce(time, cancellationToken) {
            const debouncedDataSource = new DataSource();
            let timeout;
            this.listen((v) => {
                clearTimeout(timeout);
                setTimeout(() => {
                    debouncedDataSource.update(v);
                }, time);
            }, cancellationToken);
            return debouncedDataSource;
        }
        buffer(time, cancellationToken) {
            const bufferedDataSource = new DataSource();
            let timeout;
            let buffer = [];
            this.listen((v) => {
                buffer.push(v);
                if (!timeout) {
                    setTimeout(() => {
                        timeout = undefined;
                        bufferedDataSource.update(buffer);
                        buffer = [];
                    }, time);
                }
            }, cancellationToken);
            return bufferedDataSource;
        }
        queue(time, cancellationToken) {
            const queueDataSource = new ArrayDataSource();
            this.listen((v) => {
                queueDataSource.push(v);
            }, cancellationToken);
            return queueDataSource;
        }
        pick(key, cancellationToken) {
            var _a;
            const subDataSource = new DataSource((_a = this.value) === null || _a === void 0 ? void 0 : _a[key]);
            this.listen((v) => {
                if (v !== undefined && v !== null) {
                    subDataSource.update(v[key]);
                }
                else {
                    subDataSource.update(v);
                }
            }, cancellationToken);
            return subDataSource;
        }
        cancelAll() {
            this.listeners.length = 0;
        }
    }
    exports.DataSource = DataSource;
    class ArrayDataSource {
        constructor(initialData) {
            if (initialData) {
                this.data = initialData.slice();
            }
            else {
                this.data = [];
            }
            this.onChange = new event_emitter_1.EventEmitter();
        }
        get length() {
            return this.data.length;
        }
        getData() {
            return this.data.slice();
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
            this.onChange.fire({ operation: 'replace', target: old, count: 1, index, items: [item], newState: this.data });
        }
        swap(indexA, indexB) {
            if (indexA === indexB) {
                return;
            }
            const itemA = this.data[indexA];
            const itemB = this.data[indexB];
            this.data[indexB] = itemA;
            this.data[indexA] = itemB;
            this.onChange.fire({ operation: 'swap', index: indexA, index2: indexB, items: [itemA, itemB], newState: this.data });
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
            this.onChange.fire({ operation: 'swap', index: indexA, index2: indexB, items: [itemA, itemB], newState: this.data });
        }
        push(...items) {
            this.data.push(...items);
            this.onChange.fire({
                operation: 'append',
                count: items.length,
                index: this.data.length - items.length,
                items,
                newState: this.data
            });
        }
        unshift(...items) {
            this.data.unshift(...items);
            this.onChange.fire({ operation: 'prepend', count: items.length, items, index: 0, newState: this.data });
        }
        pop() {
            const item = this.data.pop();
            this.onChange.fire({
                operation: 'remove',
                count: 1,
                index: this.data.length,
                items: [item],
                newState: this.data
            });
            return item;
        }
        merge(newData) {
            for (let i = 0; i < newData.length; i++) {
                if (this.data[i] !== newData[i]) {
                    if (this.length > i) {
                        this.set(i, newData[i]);
                    }
                    else {
                        this.push(newData[i]);
                    }
                }
            }
            if (this.length > newData.length) {
                this.removeRight(this.length - newData.length);
            }
        }
        removeRight(count) {
            const result = this.data.splice(this.length - count, count);
            this.onChange.fire({ operation: 'remove', count, index: this.length - count, items: result, newState: this.data });
        }
        removeLeft(count) {
            const result = this.data.splice(0, count);
            this.onChange.fire({ operation: 'remove', count, index: 0, items: result, newState: this.data });
        }
        remove(item) {
            const index = this.data.indexOf(item);
            if (index !== -1) {
                this.data.splice(index, 1);
                this.onChange.fire({ operation: 'remove', count: 1, index, items: [item], newState: this.data });
            }
        }
        clear() {
            const items = this.data;
            this.data = [];
            this.onChange.fire({
                operation: 'remove',
                count: items.length,
                index: 0,
                items,
                newState: this.data
            });
        }
        shift() {
            const item = this.data.shift();
            this.onChange.fire({ operation: 'remove', items: [item], count: 1, index: 0, newState: this.data });
            return item;
        }
        toArray() {
            return this.data.slice();
        }
        filter(callback, cancellationToken) {
            return new FilteredArrayView(this, callback, cancellationToken);
        }
        forEach(callbackfn, thisArg) {
            return this.data.forEach(callbackfn, thisArg);
        }
        toDataSource() {
            const stream = new DataSource(this.data);
            this.onChange.subscribe((s) => {
                stream.update(s.newState);
            });
            return stream;
        }
    }
    exports.ArrayDataSource = ArrayDataSource;
    class FilteredArrayView extends ArrayDataSource {
        constructor(parent, filter, cancellationToken) {
            const initial = parent.data.filter(filter);
            super(initial);
            this.parent = parent;
            this.viewFilter = filter;
            parent.onChange.subscribe((change) => {
                let filteredItems;
                switch (change.operation) {
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
                        this.push(...filteredItems);
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
        updateFilter(filter) {
            if (this.viewFilter === filter) {
                return;
            }
            this.viewFilter = filter;
            this.refresh();
        }
        refresh() {
            this.clear();
            const data = this.parent.data.filter(this.viewFilter);
            this.push(...data);
        }
    }
    exports.FilteredArrayView = FilteredArrayView;
});
define("utilities/owner_symbol", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ownerSymbol = Symbol('owner');
});
define("nodes/aurum_element", ["require", "exports", "stream/data_source", "utilities/cancellation_token", "utilities/owner_symbol"], function (require, exports, data_source_1, cancellation_token_1, owner_symbol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AurumElement {
        constructor(props, domNodeName) {
            var _a, _b;
            this.onDispose = props.onDispose;
            this.onAttach = props.onAttach;
            this.onDetach = props.onDetach;
            this.domNodeName = domNodeName;
            this.template = props.template;
            this.cancellationToken = new cancellation_token_1.CancellationToken();
            this.node = this.create(props);
            this.initialize(props);
            (_b = (_a = props).onCreate) === null || _b === void 0 ? void 0 : _b.call(_a, this);
        }
        initialize(props) {
            if (!(this.node instanceof Text)) {
                this.children = [];
            }
            this.createEventHandlers([
                'drag',
                'name',
                'dragstart',
                'dragend',
                'dragexit',
                'dragover',
                'dragenter',
                'dragleave',
                'blur',
                'focus',
                'click',
                'dblclick',
                'keydown',
                'keyhit',
                'keyup',
                'mousedown',
                'mouseup',
                'mouseenter',
                'mouseleave',
                'mousewheel'
            ], props);
            const dataProps = Object.keys(props).filter((e) => e.startsWith('x-') || e.startsWith('data-'));
            this.bindProps(['id', 'draggable', 'tabindex', 'style', 'role', 'contentEditable', ...dataProps], props);
            if (props.class) {
                this.handleClass(props.class);
            }
            if (props.repeatModel) {
                this.handleRepeat(props.repeatModel);
            }
        }
        bindProps(keys, props) {
            for (const key of keys) {
                if (props[key]) {
                    this.assignStringSourceToAttribute(props[key], key);
                }
            }
        }
        createEventHandlers(keys, props) {
            if (this.node instanceof Text) {
                return;
            }
            for (const key of keys) {
                const computedEventName = 'on' + key[0].toUpperCase() + key.slice(1);
                let eventEmitter;
                Object.defineProperty(this, computedEventName, {
                    get() {
                        if (!eventEmitter) {
                            eventEmitter = new data_source_1.DataSource();
                        }
                        return eventEmitter;
                    },
                    set() {
                        throw new Error(computedEventName + ' is read only');
                    }
                });
                if (props[computedEventName]) {
                    if (props[computedEventName] instanceof data_source_1.DataSource) {
                        this[computedEventName].listen(props[computedEventName].update.bind(props.onClick), this.cancellationToken);
                    }
                    else if (typeof props[computedEventName] === 'function') {
                        this[computedEventName].listen(props[computedEventName], this.cancellationToken);
                    }
                }
                this.cancellationToken.registerDomEvent(this.node, key, (e) => this[computedEventName].update(e));
            }
        }
        handleRepeat(dataSource) {
            if (dataSource instanceof data_source_1.ArrayDataSource) {
                this.repeatData = dataSource;
            }
            else {
                this.repeatData = new data_source_1.ArrayDataSource(dataSource);
            }
            if (this.repeatData.length) {
                this.children.push(...this.repeatData.toArray().map((i) => this.template.generate(i)));
                this.render();
            }
            this.repeatData.onChange.subscribe((change) => {
                switch (change.operation) {
                    case 'swap':
                        const itemA = this.children[change.index];
                        const itemB = this.children[change.index2];
                        this.children[change.index2] = itemA;
                        this.children[change.index] = itemB;
                        break;
                    case 'append':
                        this.children.push(...change.items.map((i) => this.template.generate(i)));
                        break;
                    case 'prepend':
                        this.children.unshift(...change.items.map((i) => this.template.generate(i)));
                        break;
                    case 'remove':
                        this.children.splice(change.index, change.count);
                        break;
                    default:
                        this.children.length = 0;
                        this.children.push(...this.repeatData.toArray().map((i) => this.template.generate(i)));
                        break;
                }
                this.render();
            });
        }
        render() {
            if (this.rerenderPending) {
                return;
            }
            if (this.node instanceof Text) {
                return;
            }
            setTimeout(() => {
                for (let i = 0; i < this.children.length; i++) {
                    if (this.node.childNodes.length <= i) {
                        this.addChildrenDom(this.children.slice(i, this.children.length));
                        break;
                    }
                    if (this.node.childNodes[i][owner_symbol_1.ownerSymbol] !== this.children[i]) {
                        if (!this.children.includes(this.node.childNodes[i][owner_symbol_1.ownerSymbol])) {
                            const child = this.node.childNodes[i];
                            child.remove();
                            child[owner_symbol_1.ownerSymbol].handleDetach();
                            i--;
                            continue;
                        }
                        const index = this.getChildIndex(this.children[i].node);
                        if (index !== -1) {
                            this.swapChildrenDom(i, index);
                        }
                        else {
                            this.addDomNodeAt(this.children[i].node, i);
                        }
                    }
                }
                while (this.node.childNodes.length > this.children.length) {
                    const child = this.node.childNodes[this.node.childNodes.length - 1];
                    this.node.removeChild(child);
                    child[owner_symbol_1.ownerSymbol].handleDetach();
                }
                this.rerenderPending = false;
            });
            this.rerenderPending = true;
        }
        assignStringSourceToAttribute(data, key) {
            if (this.node instanceof Text) {
                return;
            }
            if (typeof data === 'string') {
                this.node.setAttribute(key, data);
            }
            else {
                if (data.value) {
                    this.node.setAttribute(key, data.value);
                }
                data.unique(this.cancellationToken).listen((v) => this.node.setAttribute(key, v), this.cancellationToken);
            }
        }
        handleAttach() {
            var _a, _b;
            if (this.node.isConnected) {
                (_b = (_a = this).onAttach) === null || _b === void 0 ? void 0 : _b.call(_a, this);
                for (const child of this.node.childNodes) {
                    child[owner_symbol_1.ownerSymbol].handleAttach();
                }
            }
        }
        handleDetach() {
            var _a, _b;
            if (!this.node.isConnected) {
                (_b = (_a = this).onDetach) === null || _b === void 0 ? void 0 : _b.call(_a, this);
                for (const child of this.node.childNodes) {
                    child[owner_symbol_1.ownerSymbol].handleDetach();
                }
            }
        }
        handleClass(data) {
            if (this.node instanceof Text) {
                return;
            }
            if (typeof data === 'string') {
                this.node.className = data;
            }
            else if (data instanceof data_source_1.DataSource) {
                if (data.value) {
                    if (Array.isArray(data.value)) {
                        this.node.className = data.value.join(' ');
                        data.unique(this.cancellationToken).listen(() => {
                            this.node.className = data.value.join(' ');
                        }, this.cancellationToken);
                    }
                    else {
                        this.node.className = data.value;
                        data.unique(this.cancellationToken).listen(() => {
                            this.node.className = data.value;
                        }, this.cancellationToken);
                    }
                }
                data.unique(this.cancellationToken).listen((v) => (this.node.className = v), this.cancellationToken);
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
                this.node.className = value;
                for (const i of data) {
                    if (i instanceof data_source_1.DataSource) {
                        i.unique(this.cancellationToken).listen((v) => {
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
                            this.node.className = value;
                        }, this.cancellationToken);
                    }
                }
            }
        }
        resolveStringSource(source) {
            if (typeof source === 'string') {
                return source;
            }
            else {
                return source.value;
            }
        }
        create(props) {
            const node = document.createElement(this.domNodeName);
            node[owner_symbol_1.ownerSymbol] = this;
            return node;
        }
        getChildIndex(node) {
            let i = 0;
            for (const child of node.childNodes) {
                if (child === node) {
                    return i;
                }
                i++;
            }
            return -1;
        }
        hasChild(node) {
            if (this.node instanceof Text) {
                throw new Error("Text nodes don't have children");
            }
            for (const child of node.children) {
                if (child === node) {
                    return true;
                }
            }
            return false;
        }
        addChildrenDom(children) {
            if (this.node instanceof Text) {
                throw new Error("Text nodes don't have children");
            }
            for (const child of children) {
                this.node.appendChild(child.node);
                child.handleAttach();
            }
        }
        swapChildrenDom(indexA, indexB) {
            if (this.node instanceof Text) {
                throw new Error("Text nodes don't have children");
            }
            if (indexA === indexB) {
                return;
            }
            const nodeA = this.node.children[indexA];
            const nodeB = this.node.children[indexB];
            nodeA.remove();
            nodeB.remove();
            if (indexA < indexB) {
                this.addDomNodeAt(nodeB, indexA);
                this.addDomNodeAt(nodeA, indexB);
            }
            else {
                this.addDomNodeAt(nodeA, indexB);
                this.addDomNodeAt(nodeB, indexA);
            }
        }
        addDomNodeAt(node, index) {
            if (this.node instanceof Text) {
                throw new Error("Text nodes don't have children");
            }
            if (index >= this.node.childElementCount) {
                this.node.appendChild(node);
                node[owner_symbol_1.ownerSymbol].handleAttach();
            }
            else {
                this.node.insertBefore(node, this.node.children[index]);
                node[owner_symbol_1.ownerSymbol].handleAttach();
            }
        }
        remove() {
            if (this.hasParent()) {
                this.node.parentElement[owner_symbol_1.ownerSymbol].removeChild(this.node);
            }
        }
        hasParent() {
            return !!this.node.parentElement;
        }
        isConnected() {
            return this.node.isConnected;
        }
        removeChild(child) {
            const index = this.children.indexOf(child);
            if (index !== -1) {
                this.children.splice(index, 1);
            }
            this.render();
        }
        removeChildAt(index) {
            this.children.splice(index, 1);
            this.render();
        }
        swapChildren(indexA, indexB) {
            if (indexA === indexB) {
                return;
            }
            const nodeA = this.children[indexA];
            const nodeB = this.children[indexB];
            this.children[indexA] = nodeB;
            this.children[indexB] = nodeA;
            this.render();
        }
        clearChildren() {
            if (this.node instanceof Text) {
                throw new Error("Text nodes don't have children");
            }
            this.children.length = 0;
            this.render();
        }
        addChild(child) {
            if (this.node instanceof Text) {
                throw new Error("Text nodes don't have children");
            }
            if (child instanceof Template) {
                return;
            }
            child = this.childNodeToAurum(child);
            this.children.push(child);
            this.render();
        }
        childNodeToAurum(child) {
            if (typeof child === 'string' || child instanceof data_source_1.DataSource) {
                child = new TextNode({
                    text: child
                });
            }
            else if (!(child instanceof AurumElement)) {
                child = new TextNode({
                    text: child.toString()
                });
            }
            return child;
        }
        addChildAt(child, index) {
            if (this.node instanceof Text) {
                throw new Error("Text nodes don't have children");
            }
            if (child instanceof Template) {
                return;
            }
            child = this.childNodeToAurum(child);
            this.children.splice(index, 0, child);
            this.render();
        }
        addChildren(nodes) {
            if (this.node instanceof Text) {
                throw new Error("Text nodes don't have children");
            }
            if (nodes.length === 0) {
                return;
            }
            for (const child of nodes) {
                this.addChild(child);
            }
        }
        dispose() {
            this.internalDispose(true);
        }
        internalDispose(detach) {
            var _a, _b;
            this.cancellationToken.cancel();
            if (detach) {
                this.remove();
            }
            for (const child of this.node.childNodes) {
                if (child[owner_symbol_1.ownerSymbol]) {
                    child[owner_symbol_1.ownerSymbol].internalDispose(false);
                }
            }
            (_b = (_a = this).onDispose) === null || _b === void 0 ? void 0 : _b.call(_a, this);
        }
    }
    exports.AurumElement = AurumElement;
    class Template extends AurumElement {
        constructor(props) {
            super(props, 'template');
            this.ref = props.ref;
            this.generate = props.generator;
        }
    }
    exports.Template = Template;
    class TextNode extends AurumElement {
        constructor(props) {
            super(props, 'textNode');
            if (props.text instanceof data_source_1.DataSource) {
                props.text.listen((v) => (this.node.textContent = v), this.cancellationToken);
            }
        }
        create(props) {
            const node = document.createTextNode(this.resolveStringSource(props.text));
            node[owner_symbol_1.ownerSymbol] = this;
            return node;
        }
    }
    exports.TextNode = TextNode;
});
define("nodes/a", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class A extends aurum_element_1.AurumElement {
        constructor(props) {
            super(props, 'a');
            this.bindProps(['href', 'target'], props);
        }
    }
    exports.A = A;
});
define("nodes/abbr", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Abbr extends aurum_element_2.AurumElement {
        constructor(props) {
            super(props, 'abbr');
        }
    }
    exports.Abbr = Abbr;
});
define("nodes/area", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Area extends aurum_element_3.AurumElement {
        constructor(props) {
            super(props, 'area');
        }
    }
    exports.Area = Area;
});
define("nodes/article", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Article extends aurum_element_4.AurumElement {
        constructor(props) {
            super(props, 'article');
        }
    }
    exports.Article = Article;
});
define("nodes/aside", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Aside extends aurum_element_5.AurumElement {
        constructor(props) {
            super(props, 'aside');
        }
    }
    exports.Aside = Aside;
});
define("nodes/audio", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Audio extends aurum_element_6.AurumElement {
        constructor(props) {
            super(props, 'audio');
            this.bindProps(['controls', 'autoplay', 'loop', 'muted', 'preload', 'src'], props);
        }
    }
    exports.Audio = Audio;
});
define("nodes/b", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class B extends aurum_element_7.AurumElement {
        constructor(props) {
            super(props, 'b');
        }
    }
    exports.B = B;
});
define("nodes/br", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Br extends aurum_element_8.AurumElement {
        constructor(props) {
            super(props, 'br');
        }
    }
    exports.Br = Br;
});
define("nodes/button", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Button extends aurum_element_9.AurumElement {
        constructor(props) {
            super(props, 'button');
            this.bindProps(['disabled'], props);
        }
    }
    exports.Button = Button;
});
define("nodes/canvas", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Canvas extends aurum_element_10.AurumElement {
        constructor(props) {
            super(props, 'canvas');
            this.bindProps(['width', 'height'], props);
        }
    }
    exports.Canvas = Canvas;
});
define("nodes/data", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Data extends aurum_element_11.AurumElement {
        constructor(props) {
            super(props, 'data');
            this.bindProps(['datalue'], props);
        }
    }
    exports.Data = Data;
});
define("nodes/details", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Details extends aurum_element_12.AurumElement {
        constructor(props) {
            super(props, 'details');
        }
    }
    exports.Details = Details;
});
define("nodes/div", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Div extends aurum_element_13.AurumElement {
        constructor(props) {
            super(props, 'div');
        }
    }
    exports.Div = Div;
});
define("nodes/em", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Em extends aurum_element_14.AurumElement {
        constructor(props) {
            super(props, 'em');
        }
    }
    exports.Em = Em;
});
define("nodes/footer", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_15) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Footer extends aurum_element_15.AurumElement {
        constructor(props) {
            super(props, 'footer');
        }
    }
    exports.Footer = Footer;
});
define("nodes/form", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_16) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Form extends aurum_element_16.AurumElement {
        constructor(props) {
            super(props, 'form');
        }
    }
    exports.Form = Form;
});
define("nodes/h1", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_17) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class H1 extends aurum_element_17.AurumElement {
        constructor(props) {
            super(props, 'h1');
        }
    }
    exports.H1 = H1;
});
define("nodes/h2", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_18) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class H2 extends aurum_element_18.AurumElement {
        constructor(props) {
            super(props, 'h2');
        }
    }
    exports.H2 = H2;
});
define("nodes/h3", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_19) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class H3 extends aurum_element_19.AurumElement {
        constructor(props) {
            super(props, 'h3');
        }
    }
    exports.H3 = H3;
});
define("nodes/h4", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_20) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class H4 extends aurum_element_20.AurumElement {
        constructor(props) {
            super(props, 'h4');
        }
    }
    exports.H4 = H4;
});
define("nodes/h5", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_21) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class H5 extends aurum_element_21.AurumElement {
        constructor(props) {
            super(props, 'h5');
        }
    }
    exports.H5 = H5;
});
define("nodes/h6", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_22) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class H6 extends aurum_element_22.AurumElement {
        constructor(props) {
            super(props, 'h6');
        }
    }
    exports.H6 = H6;
});
define("nodes/header", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_23) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Header extends aurum_element_23.AurumElement {
        constructor(props) {
            super(props, 'header');
        }
    }
    exports.Header = Header;
});
define("nodes/heading", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_24) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Heading extends aurum_element_24.AurumElement {
        constructor(props) {
            super(props, 'heading');
        }
    }
    exports.Heading = Heading;
});
define("nodes/i", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_25) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class I extends aurum_element_25.AurumElement {
        constructor(props) {
            super(props, 'i');
        }
    }
    exports.I = I;
});
define("nodes/iframe", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_26) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class IFrame extends aurum_element_26.AurumElement {
        constructor(props) {
            super(props, 'iframe');
            this.bindProps(['src', 'srcdoc', 'width', 'height', 'allow', 'allowFullscreen', 'allowPaymentRequest'], props);
        }
    }
    exports.IFrame = IFrame;
});
define("nodes/img", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_27) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Img extends aurum_element_27.AurumElement {
        constructor(props) {
            super(props, 'img');
            this.bindProps(['src', 'alt', 'width', 'height', 'referrerPolicy', 'sizes', 'srcset', 'useMap'], props);
        }
    }
    exports.Img = Img;
});
define("nodes/input", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_28) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Input extends aurum_element_28.AurumElement {
        constructor(props) {
            var _a, _b, _c;
            super(props, 'input');
            if (props.inputValueSource) {
                this.node.value = (_b = (_a = props.initialValue, (_a !== null && _a !== void 0 ? _a : props.inputValueSource.value)), (_b !== null && _b !== void 0 ? _b : ''));
                props.inputValueSource.unique().listen((value) => (this.node.value = value), this.cancellationToken);
            }
            else {
                this.node.value = (_c = props.initialValue, (_c !== null && _c !== void 0 ? _c : ''));
            }
            this.bindProps([
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
            ], props);
            this.createEventHandlers(['input', 'change'], props);
            if (props.inputValueSource) {
                this.onInput.map((p) => this.node.value).pipe(props.inputValueSource);
            }
        }
    }
    exports.Input = Input;
});
define("nodes/label", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_29) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Label extends aurum_element_29.AurumElement {
        constructor(props) {
            super(props, 'label');
            this.bindProps(['for'], props);
        }
    }
    exports.Label = Label;
});
define("nodes/li", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_30) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Li extends aurum_element_30.AurumElement {
        constructor(props) {
            super(props, 'li');
        }
    }
    exports.Li = Li;
});
define("nodes/link", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_31) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Link extends aurum_element_31.AurumElement {
        constructor(props) {
            super(props, 'link');
            this.bindProps(['href', 'rel', 'media', 'as', 'disabled', 'type'], props);
        }
    }
    exports.Link = Link;
});
define("nodes/nav", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_32) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Nav extends aurum_element_32.AurumElement {
        constructor(props) {
            super(props, 'nav');
        }
    }
    exports.Nav = Nav;
});
define("nodes/noscript", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_33) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NoScript extends aurum_element_33.AurumElement {
        constructor(props) {
            super(props, 'noscript');
        }
    }
    exports.NoScript = NoScript;
});
define("nodes/ol", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_34) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Ol extends aurum_element_34.AurumElement {
        constructor(props) {
            super(props, 'ol');
        }
    }
    exports.Ol = Ol;
});
define("nodes/option", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_35) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Option extends aurum_element_35.AurumElement {
        constructor(props) {
            super(props, 'option');
        }
    }
    exports.Option = Option;
});
define("nodes/p", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_36) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class P extends aurum_element_36.AurumElement {
        constructor(props) {
            super(props, 'p');
        }
    }
    exports.P = P;
});
define("nodes/pre", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_37) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Pre extends aurum_element_37.AurumElement {
        constructor(props) {
            super(props, 'pre');
        }
    }
    exports.Pre = Pre;
});
define("nodes/progress", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_38) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Progress extends aurum_element_38.AurumElement {
        constructor(props) {
            super(props, 'progress');
            this.bindProps(['max', 'value'], props);
        }
    }
    exports.Progress = Progress;
});
define("nodes/q", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_39) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Q extends aurum_element_39.AurumElement {
        constructor(props) {
            super(props, 'q');
        }
    }
    exports.Q = Q;
});
define("nodes/script", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_40) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Script extends aurum_element_40.AurumElement {
        constructor(props) {
            super(props, 'script');
            this.bindProps(['src', 'async', 'defer', 'integrity', 'noModule', 'type'], props);
        }
    }
    exports.Script = Script;
});
define("nodes/select", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_41) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Select extends aurum_element_41.AurumElement {
        constructor(props) {
            super(props, 'select');
        }
    }
    exports.Select = Select;
});
define("nodes/source", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_42) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Source extends aurum_element_42.AurumElement {
        constructor(props) {
            super(props, 'source');
            this.bindProps(['src', 'srcSet', 'media', 'sizes', 'type'], props);
        }
    }
    exports.Source = Source;
});
define("nodes/span", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_43) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Span extends aurum_element_43.AurumElement {
        constructor(props) {
            super(props, 'span');
        }
    }
    exports.Span = Span;
});
define("nodes/sub", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_44) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Sub extends aurum_element_44.AurumElement {
        constructor(props) {
            super(props, 'sub');
        }
    }
    exports.Sub = Sub;
});
define("nodes/summary", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_45) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Summary extends aurum_element_45.AurumElement {
        constructor(props) {
            super(props, 'summary');
        }
    }
    exports.Summary = Summary;
});
define("nodes/sup", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_46) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Sup extends aurum_element_46.AurumElement {
        constructor(props) {
            super(props, 'sup');
        }
    }
    exports.Sup = Sup;
});
define("nodes/svg", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_47) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Svg extends aurum_element_47.AurumElement {
        constructor(props) {
            super(props, 'svg');
            this.bindProps(['width', 'height'], props);
        }
    }
    exports.Svg = Svg;
});
define("nodes/table", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_48) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Table extends aurum_element_48.AurumElement {
        constructor(props) {
            super(props, 'table');
        }
    }
    exports.Table = Table;
});
define("nodes/tbody", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_49) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Tbody extends aurum_element_49.AurumElement {
        constructor(props) {
            super(props, 'tbody');
        }
    }
    exports.Tbody = Tbody;
});
define("nodes/td", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_50) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Td extends aurum_element_50.AurumElement {
        constructor(props) {
            super(props, 'td');
        }
    }
    exports.Td = Td;
});
define("nodes/textarea", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_51) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TextArea extends aurum_element_51.AurumElement {
        constructor(props) {
            var _a, _b, _c;
            super(props, 'textArea');
            if (props.inputValueSource) {
                this.node.value = (_b = (_a = props.initialValue, (_a !== null && _a !== void 0 ? _a : props.inputValueSource.value)), (_b !== null && _b !== void 0 ? _b : ''));
                props.inputValueSource.unique().listen((value) => (this.node.value = value), this.cancellationToken);
            }
            else {
                this.node.value = (_c = props.initialValue, (_c !== null && _c !== void 0 ? _c : ''));
            }
            this.bindProps(['placeholder', 'readonly', 'disabled', 'rows', 'wrap', 'autocomplete', 'autofocus', 'max', 'maxLength', 'min', 'minLength', 'required', 'type'], props);
            this.createEventHandlers(['input', 'change'], props);
            if (props.inputValueSource) {
                this.onInput.map((p) => this.node.value).pipe(props.inputValueSource);
            }
        }
    }
    exports.TextArea = TextArea;
});
define("nodes/tfoot", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_52) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Tfoot extends aurum_element_52.AurumElement {
        constructor(props) {
            super(props, 'tfoot');
        }
    }
    exports.Tfoot = Tfoot;
});
define("nodes/th", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_53) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Th extends aurum_element_53.AurumElement {
        constructor(props) {
            super(props, 'th');
        }
    }
    exports.Th = Th;
});
define("nodes/thead", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_54) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Thead extends aurum_element_54.AurumElement {
        constructor(props) {
            super(props, 'thead');
        }
    }
    exports.Thead = Thead;
});
define("nodes/time", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_55) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Time extends aurum_element_55.AurumElement {
        constructor(props) {
            super(props, 'time');
            this.bindProps(['datetime'], props);
        }
    }
    exports.Time = Time;
});
define("nodes/title", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_56) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Title extends aurum_element_56.AurumElement {
        constructor(props) {
            super(props, 'title');
        }
    }
    exports.Title = Title;
});
define("nodes/tr", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_57) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Tr extends aurum_element_57.AurumElement {
        constructor(props) {
            super(props, 'tr');
        }
    }
    exports.Tr = Tr;
});
define("nodes/ul", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_58) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Ul extends aurum_element_58.AurumElement {
        constructor(props) {
            super(props, 'ul');
        }
    }
    exports.Ul = Ul;
});
define("nodes/video", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_59) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Video extends aurum_element_59.AurumElement {
        constructor(props) {
            super(props, 'video');
            this.bindProps(['controls', 'autoplay', 'loop', 'muted', 'preload', 'src', 'poster', 'width', 'height'], props);
        }
    }
    exports.Video = Video;
});
define("nodes/style", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_60) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Style extends aurum_element_60.AurumElement {
        constructor(props) {
            super(props, 'style');
            this.bindProps(['media'], props);
        }
    }
    exports.Style = Style;
});
define("nodes/special/switch", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_61) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Switch extends aurum_element_61.AurumElement {
        constructor(props) {
            super(props, 'switch');
            this.firstRender = true;
            this.templateMap = props.templateMap;
            this.renderSwitch(props.state.value);
            props.state.listen((data) => {
                this.renderSwitch(data);
            }, this.cancellationToken);
        }
        renderSwitch(data) {
            var _a;
            if (data !== this.lastValue || this.firstRender) {
                this.lastValue = data;
                this.firstRender = false;
                this.clearChildren();
                if (data !== undefined && data !== null) {
                    const template = (_a = this.templateMap[data.toString()], (_a !== null && _a !== void 0 ? _a : this.template));
                    if (template) {
                        const result = template.generate();
                        this.addChild(result);
                    }
                }
                else if (this.template) {
                    const result = this.template.generate();
                    this.addChild(result);
                }
            }
        }
    }
    exports.Switch = Switch;
});
define("nodes/special/router", ["require", "exports", "nodes/special/switch", "stream/data_source"], function (require, exports, switch_1, data_source_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AurumRouter extends switch_1.Switch {
        constructor(props) {
            const urlDataSource = new data_source_2.DataSource(location.hash.substring(1));
            super(Object.assign(Object.assign({}, props), { state: urlDataSource }));
            window.addEventListener('hashchange', () => {
                urlDataSource.update(location.hash.substring(1));
            });
        }
    }
    exports.AurumRouter = AurumRouter;
});
define("nodes/special/suspense", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_62) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Suspense extends aurum_element_62.AurumElement {
        constructor(props) {
            super(props, 'suspense');
            props.loader().then((newElement) => {
                this.clearChildren();
                this.addChild(newElement);
            });
        }
    }
    exports.Suspense = Suspense;
});
define("utilities/aurum", ["require", "exports", "nodes/aurum_element", "utilities/owner_symbol", "nodes/div", "nodes/button", "nodes/input", "nodes/li", "nodes/span", "nodes/style", "nodes/ul", "nodes/p", "nodes/img", "nodes/link", "nodes/canvas", "nodes/a", "nodes/article", "nodes/br", "nodes/form", "nodes/label", "nodes/ol", "nodes/pre", "nodes/progress", "nodes/table", "nodes/td", "nodes/tr", "nodes/th", "nodes/textarea", "nodes/h1", "nodes/h2", "nodes/h3", "nodes/h4", "nodes/h5", "nodes/h6", "nodes/header", "nodes/footer", "nodes/nav", "nodes/b", "nodes/i", "nodes/script", "nodes/abbr", "nodes/area", "nodes/aside", "nodes/em", "nodes/heading", "nodes/iframe", "nodes/noscript", "q", "nodes/select", "nodes/source", "nodes/title", "nodes/video", "nodes/tbody", "nodes/tfoot", "nodes/thead", "nodes/summary", "nodes/details", "nodes/sub", "nodes/sup", "nodes/svg", "nodes/data", "nodes/time"], function (require, exports, aurum_element_63, owner_symbol_2, div_1, button_1, input_1, li_1, span_1, style_1, ul_1, p_1, img_1, link_1, canvas_1, a_1, article_1, br_1, form_1, label_1, ol_1, pre_1, progress_1, table_1, td_1, tr_1, th_1, textarea_1, h1_1, h2_1, h3_1, h4_1, h5_1, h6_1, header_1, footer_1, nav_1, b_1, i_1, script_1, abbr_1, area_1, aside_1, em_1, heading_1, iframe_1, noscript_1, q_1, select_1, source_1, title_1, video_1, tbody_1, tfoot_1, thead_1, summary_1, details_1, sub_1, sup_1, svg_1, data_1, time_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const nodeMap = {
        button: button_1.Button,
        div: div_1.Div,
        input: input_1.Input,
        li: li_1.Li,
        span: span_1.Span,
        style: style_1.Style,
        ul: ul_1.Ul,
        p: p_1.P,
        img: img_1.Img,
        link: link_1.Link,
        canvas: canvas_1.Canvas,
        a: a_1.A,
        article: article_1.Article,
        br: br_1.Br,
        form: form_1.Form,
        label: label_1.Label,
        ol: ol_1.Ol,
        pre: pre_1.Pre,
        progress: progress_1.Progress,
        table: table_1.Table,
        td: td_1.Td,
        tr: tr_1.Tr,
        th: th_1.Th,
        textarea: textarea_1.TextArea,
        h1: h1_1.H1,
        h2: h2_1.H2,
        h3: h3_1.H3,
        h4: h4_1.H4,
        h5: h5_1.H5,
        h6: h6_1.H6,
        header: header_1.Header,
        footer: footer_1.Footer,
        nav: nav_1.Nav,
        b: b_1.B,
        i: i_1.I,
        script: script_1.Script,
        abbr: abbr_1.Abbr,
        area: area_1.Area,
        aside: aside_1.Aside,
        audio: Audio,
        em: em_1.Em,
        heading: heading_1.Heading,
        iframe: iframe_1.IFrame,
        noscript: noscript_1.NoScript,
        option: Option,
        q: q_1.default,
        select: select_1.Select,
        source: source_1.Source,
        title: title_1.Title,
        video: video_1.Video,
        tbody: tbody_1.Tbody,
        tfoot: tfoot_1.Tfoot,
        thead: thead_1.Thead,
        summary: summary_1.Summary,
        details: details_1.Details,
        sub: sub_1.Sub,
        sup: sup_1.Sup,
        svg: svg_1.Svg,
        data: data_1.Data,
        time: time_1.Time,
        template: aurum_element_63.Template
    };
    class Aurum {
        static attach(aurumElement, dom) {
            if (dom[owner_symbol_2.ownerSymbol]) {
                throw new Error('This node is already managed by aurum and cannot be used');
            }
            dom.appendChild(aurumElement.node);
            aurumElement['handleAttach']();
            dom[owner_symbol_2.ownerSymbol] = aurumElement;
        }
        static detach(domNode) {
            if (domNode[owner_symbol_2.ownerSymbol]) {
                domNode[owner_symbol_2.ownerSymbol].node.remove();
                domNode[owner_symbol_2.ownerSymbol].handleDetach();
                domNode[owner_symbol_2.ownerSymbol].dispose();
                domNode[owner_symbol_2.ownerSymbol] = undefined;
            }
        }
        static factory(node, args, ...innerNodes) {
            if (typeof node === 'string') {
                const type = node;
                node = nodeMap[node];
                if (node === undefined) {
                    throw new Error(`Node ${type} does not exist or is not supported`);
                }
            }
            const children = [].concat(...innerNodes).filter((e) => e);
            const templateMap = {};
            let defaultTemplate;
            let hasRef = false;
            for (const c of children) {
                if (typeof c === 'string') {
                    continue;
                }
                if (c instanceof aurum_element_63.Template && (!c.ref || c.ref === 'default')) {
                    defaultTemplate = c;
                }
                if (c.ref) {
                    templateMap[c.ref] = c;
                    hasRef = true;
                }
            }
            args = (args !== null && args !== void 0 ? args : {});
            if (defaultTemplate) {
                args.template = defaultTemplate;
            }
            if (hasRef) {
                args.templateMap = templateMap;
            }
            let instance;
            if (node.prototype) {
                instance = new node(args || {});
            }
            else {
                instance = node(args || {});
            }
            instance.addChildren(children);
            return instance;
        }
    }
    exports.Aurum = Aurum;
});
define("aurumjs", ["require", "exports", "nodes/a", "nodes/abbr", "nodes/area", "nodes/article", "nodes/aside", "nodes/audio", "nodes/aurum_element", "nodes/b", "nodes/br", "nodes/button", "nodes/canvas", "nodes/data", "nodes/details", "nodes/div", "nodes/em", "nodes/footer", "nodes/form", "nodes/h1", "nodes/h2", "nodes/h3", "nodes/h4", "nodes/h5", "nodes/h6", "nodes/header", "nodes/heading", "nodes/i", "nodes/iframe", "nodes/img", "nodes/input", "nodes/label", "nodes/li", "nodes/link", "nodes/nav", "nodes/noscript", "nodes/ol", "nodes/option", "nodes/p", "nodes/pre", "nodes/progress", "nodes/q", "nodes/script", "nodes/select", "nodes/source", "nodes/span", "nodes/special/router", "nodes/special/suspense", "nodes/special/switch", "nodes/style", "nodes/sub", "nodes/summary", "nodes/sup", "nodes/svg", "nodes/table", "nodes/tbody", "nodes/td", "nodes/textarea", "nodes/tfoot", "nodes/th", "nodes/thead", "nodes/time", "nodes/title", "nodes/tr", "nodes/ul", "nodes/video", "stream/data_source", "stream/event_emitter", "utilities/aurum", "utilities/cancellation_token"], function (require, exports, a_2, abbr_2, area_2, article_2, aside_2, audio_1, aurum_element_64, b_2, br_2, button_2, canvas_2, data_2, details_2, div_2, em_2, footer_2, form_2, h1_2, h2_2, h3_2, h4_2, h5_2, h6_2, header_2, heading_2, i_2, iframe_2, img_2, input_2, label_2, li_2, link_2, nav_2, noscript_2, ol_2, option_1, p_2, pre_2, progress_2, q_2, script_2, select_2, source_2, span_2, router_1, suspense_1, switch_2, style_2, sub_2, summary_2, sup_2, svg_2, table_2, tbody_2, td_2, textarea_2, tfoot_2, th_2, thead_2, time_2, title_2, tr_2, ul_2, video_2, data_source_3, event_emitter_2, aurum_1, cancellation_token_2) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(a_2);
    __export(abbr_2);
    __export(area_2);
    __export(article_2);
    __export(aside_2);
    __export(audio_1);
    __export(aurum_element_64);
    __export(b_2);
    __export(br_2);
    __export(button_2);
    __export(canvas_2);
    __export(data_2);
    __export(details_2);
    __export(div_2);
    __export(em_2);
    __export(footer_2);
    __export(form_2);
    __export(h1_2);
    __export(h2_2);
    __export(h3_2);
    __export(h4_2);
    __export(h5_2);
    __export(h6_2);
    __export(header_2);
    __export(heading_2);
    __export(i_2);
    __export(iframe_2);
    __export(img_2);
    __export(input_2);
    __export(label_2);
    __export(li_2);
    __export(link_2);
    __export(nav_2);
    __export(noscript_2);
    __export(ol_2);
    __export(option_1);
    __export(p_2);
    __export(pre_2);
    __export(progress_2);
    __export(q_2);
    __export(script_2);
    __export(select_2);
    __export(source_2);
    __export(span_2);
    __export(router_1);
    __export(suspense_1);
    __export(switch_2);
    __export(style_2);
    __export(sub_2);
    __export(summary_2);
    __export(sup_2);
    __export(svg_2);
    __export(table_2);
    __export(tbody_2);
    __export(td_2);
    __export(textarea_2);
    __export(tfoot_2);
    __export(th_2);
    __export(thead_2);
    __export(time_2);
    __export(title_2);
    __export(tr_2);
    __export(ul_2);
    __export(video_2);
    __export(data_source_3);
    __export(event_emitter_2);
    __export(aurum_1);
    __export(cancellation_token_2);
});
define("nodes/address", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_65) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Address extends aurum_element_65.AurumElement {
        constructor(props) {
            super(props, 'address');
        }
    }
    exports.Address = Address;
});
define("nodes/hr", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_66) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Hr extends aurum_element_66.AurumElement {
        constructor(props) {
            super(props, 'hr');
        }
    }
    exports.Hr = Hr;
});
define("nodes/special/custom", ["require", "exports", "aurumjs"], function (require, exports, aurumjs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Custom extends aurumjs_1.AurumElement {
        constructor(props) {
            super(props, props.tag);
            if (props.attributes) {
                this.bindProps(Object.keys(props.attributes), props.attributes);
            }
        }
    }
    exports.Custom = Custom;
});
//# sourceMappingURL=aurum.js.map