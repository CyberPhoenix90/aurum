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
define("stream/data_source", ["require", "exports"], function (require, exports) {
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
            const uniqueSource = new DataSource();
            this.listen((value) => {
                if (value !== uniqueSource.value) {
                    uniqueSource.update(value);
                }
            }, cancellationToken);
            return uniqueSource;
        }
        reduce(reducer, cancellationToken) {
            const reduceSource = new DataSource();
            this.listen((v) => reduceSource.update(reducer(reduceSource.value, v)), cancellationToken);
            return reduceSource;
        }
        combine(otherSource, combinator, cancellationToken) {
            const combinedDataSource = new DataSource();
            this.listen(() => combinedDataSource.update(combinator(this.value, otherSource.value)), cancellationToken);
            otherSource.listen(() => combinedDataSource.update(combinator(this.value, otherSource.value)), cancellationToken);
            return combinedDataSource;
        }
        pick(key, cancellationToken) {
            const subDataSource = new DataSource();
            this.listen((v) => {
                subDataSource.update(v[key]);
            }, cancellationToken);
            return subDataSource;
        }
        cancelAll() {
            this.listeners.length = 0;
        }
    }
    exports.DataSource = DataSource;
});
define("utilities/common", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("nodes/template", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Template extends aurum_element_1.AurumElement {
        constructor(props) {
            super(props, 'template');
            this.ref = props.ref;
            this.generate = props.generator;
        }
    }
    exports.Template = Template;
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
define("stream/array_data_source", ["require", "exports", "stream/event_emitter", "stream/data_source"], function (require, exports, event_emitter_1, data_source_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
                operation: 'removeRight',
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
            this.onChange.fire({ operation: 'removeRight', count, index: this.length, items: result, newState: this.data });
        }
        removeLeft(count) {
            const result = this.data.splice(0, count);
            this.onChange.fire({ operation: 'removeLeft', count, index: 0, items: result, newState: this.data });
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
            this.onChange.fire({ operation: 'removeLeft', items: [item], count: 1, index: 0, newState: this.data });
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
            const stream = new data_source_1.DataSource(this.data);
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
                    case 'removeLeft':
                    case 'removeRight':
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
                            break;
                        }
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
define("nodes/aurum_element", ["require", "exports", "stream/data_source", "utilities/cancellation_token", "nodes/template", "stream/array_data_source"], function (require, exports, data_source_2, cancellation_token_1, template_1, array_data_source_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AurumElement {
        constructor(props, domNodeName) {
            this.domNodeName = domNodeName;
            this.template = props.template;
            this.cancellationToken = new cancellation_token_1.CancellationToken();
            this.node = this.create(props);
            this.initialize(props);
            if (props.onAttach) {
                props.onAttach(this);
            }
        }
        createEventHandlers(keys, props) {
            for (const key of keys) {
                const computedEventName = 'on' + key[0].toUpperCase() + key.slice(1);
                let eventEmitter;
                Object.defineProperty(this, computedEventName, {
                    get() {
                        if (!eventEmitter) {
                            eventEmitter = new data_source_2.DataSource();
                        }
                        return eventEmitter;
                    },
                    set() {
                        throw new Error(computedEventName + ' is read only');
                    }
                });
                if (props[computedEventName]) {
                    if (props[computedEventName] instanceof data_source_2.DataSource) {
                        this[computedEventName].listen(props[computedEventName].update.bind(props.onClick), this.cancellationToken);
                    }
                    else if (typeof props[computedEventName] === 'function') {
                        this[computedEventName].listen(props[computedEventName], this.cancellationToken);
                    }
                }
                this.cancellationToken.registerDomEvent(this.node, key, (e) => this[computedEventName].update(e));
            }
        }
        initialize(props) {
            this.node.owner = this;
            this.createEventHandlers(['click', 'keydown', 'keyhit', 'keyup', 'mousedown, mouseup', 'mouseenter', 'mouseleave'], props);
            if (props.id) {
                this.assignStringSourceToAttribute(props.id, 'id');
            }
            if (props.class) {
                this.handleClass(props.class);
            }
            if (props.repeatModel) {
                this.cachedChildren = [];
                this.handleRepeat(props.repeatModel);
            }
        }
        handleRepeat(dataSource) {
            if (dataSource instanceof array_data_source_1.ArrayDataSource) {
                this.repeatData = dataSource;
            }
            else {
                this.repeatData = new array_data_source_1.ArrayDataSource(dataSource);
            }
            if (this.repeatData.length) {
                this.cachedChildren.push(...this.repeatData.toArray().map((i) => this.template.generate(i)));
                this.renderRepeat();
            }
            this.repeatData.onChange.subscribe((change) => {
                switch (change.operation) {
                    case 'append':
                        this.cachedChildren.push(...change.items.map((i) => this.template.generate(i)));
                        break;
                    case 'removeLeft':
                        this.cachedChildren.splice(0, change.count);
                        break;
                    case 'removeRight':
                        this.cachedChildren.splice(this.node.childElementCount - change.count, change.count);
                        break;
                    case 'remove':
                        this.cachedChildren.splice(change.index, change.count);
                        break;
                    default:
                        this.cachedChildren.length = 0;
                        this.cachedChildren.push(...this.repeatData.toArray().map((i) => this.template.generate(i)));
                        break;
                }
                this.renderRepeat();
            });
        }
        renderRepeat() {
            if (this.rerenderPending) {
                return;
            }
            setTimeout(() => {
                for (let i = 0; i < this.cachedChildren.length; i++) {
                    if (this.node.childElementCount <= i) {
                        this.addChildren(this.cachedChildren.slice(i, this.cachedChildren.length));
                        break;
                    }
                    if (this.node.children[i].owner !== this.cachedChildren[i]) {
                        if (!this.cachedChildren.includes(this.node.children[i].owner)) {
                            this.node.children[i].remove();
                            i--;
                            continue;
                        }
                        const index = this.getChildIndex(this.cachedChildren[i].node);
                        if (index !== -1) {
                            this.swapChildren(i, index);
                        }
                        else {
                            this.addChildAt(this.cachedChildren[i], i);
                        }
                    }
                }
                while (this.node.childElementCount > this.cachedChildren.length) {
                    this.node.removeChild(this.node.lastChild);
                }
                this.rerenderPending = false;
            });
            this.rerenderPending = true;
        }
        assignStringSourceToAttribute(data, key) {
            if (typeof data === 'string') {
                this.node[key] = data;
            }
            else {
                if (data.value) {
                    this.node[key] = data.value;
                }
                data.unique(this.cancellationToken).listen((v) => (this.node.id = v), this.cancellationToken);
            }
        }
        handleClass(data) {
            if (typeof data === 'string') {
                this.node.className = data;
            }
            else if (data instanceof data_source_2.DataSource) {
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
                    if (i instanceof data_source_2.DataSource) {
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
        create(props) {
            const node = document.createElement(this.domNodeName);
            return node;
        }
        getChildIndex(node) {
            let i = 0;
            for (const child of node.children) {
                if (child === node) {
                    return i;
                }
                i++;
            }
            return -1;
        }
        hasChild(node) {
            for (const child of node.children) {
                if (child === node) {
                    return true;
                }
            }
            return false;
        }
        setInnerText(value) {
            this.node.innerText = value;
        }
        swapChildren(indexA, indexB) {
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
            if (index >= this.node.childElementCount) {
                this.node.appendChild(node);
            }
            else {
                this.node.insertBefore(node, this.node.children[index]);
            }
        }
        addChildAt(child, index) {
            if (child instanceof template_1.Template) {
                return;
            }
            return this.addDomNodeAt(child.node, index);
        }
        addChildren(nodes) {
            if (nodes.length === 0) {
                return;
            }
            let dataSegments = [];
            for (const c of nodes) {
                if (c instanceof template_1.Template) {
                    continue;
                }
                if (typeof c === 'string') {
                    dataSegments.push(c);
                }
                else if (c instanceof data_source_2.DataSource) {
                    dataSegments.push(c);
                    this.setInnerText(c.value);
                    c.listen((v) => {
                        const value = dataSegments.reduce((p, c) => { var _a; return p + (c instanceof data_source_2.DataSource ? (_a = c.value, (_a !== null && _a !== void 0 ? _a : '')).toString() : c); }, '');
                        this.setInnerText(value);
                    }, this.cancellationToken);
                }
                else {
                    this.node.appendChild(c.node);
                }
            }
            if (dataSegments.length) {
                const value = dataSegments.reduce((p, c) => { var _a; return p + (c instanceof data_source_2.DataSource ? (_a = c.value, (_a !== null && _a !== void 0 ? _a : '')).toString() : c); }, '');
                this.setInnerText(value);
            }
        }
    }
    exports.AurumElement = AurumElement;
});
define("jsx/jsx_factory", ["require", "exports", "nodes/template"], function (require, exports, template_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class JavascriptXMLSyntax {
        deserialize(node, args, ...innerNodes) {
            if (typeof node === 'string') {
                return;
            }
            const children = [].concat(...innerNodes).filter((e) => e);
            const refs = {};
            let hasRef = false;
            for (const c of children) {
                if (typeof c === 'string') {
                    continue;
                }
                if (c instanceof template_2.Template && !c.ref) {
                    refs['template'] = c;
                    hasRef = true;
                }
                if (c.ref) {
                    refs[c.ref] = c;
                    hasRef = true;
                }
            }
            if (hasRef) {
                Object.assign(args, refs);
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
    exports.jsx = new JavascriptXMLSyntax();
});
define("utilities/owner_symbol", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ownerSymbol = Symbol('owner');
});
define("utilities/aurum", ["require", "exports", "utilities/owner_symbol"], function (require, exports, owner_symbol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Aurum {
        static attach(node, dom) {
            if (dom[owner_symbol_1.ownerSymbol]) {
                throw new Error('This node is already managed by aurum and cannot be used');
            }
            dom.appendChild(node.node);
            dom[owner_symbol_1.ownerSymbol] = node;
        }
        static detach(domNode) {
            if (domNode[owner_symbol_1.ownerSymbol]) {
                domNode[owner_symbol_1.ownerSymbol].dispose();
                domNode[owner_symbol_1.ownerSymbol] = undefined;
            }
        }
    }
    exports.Aurum = Aurum;
});
define("nodes/button", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Button extends aurum_element_2.AurumElement {
        constructor(props) {
            super(props, 'button');
        }
    }
    exports.Button = Button;
});
define("nodes/div", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Div extends aurum_element_3.AurumElement {
        constructor(props) {
            super(props, 'div');
        }
    }
    exports.Div = Div;
});
define("nodes/input", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Input extends aurum_element_4.AurumElement {
        constructor(props) {
            super(props, 'input');
            if (props.inputValueSource) {
                props.inputValueSource.listen((value) => (this.node.value = value), this.cancellationToken);
            }
            if (props.placeholder) {
                this.assignStringSourceToAttribute(props.placeholder, 'placeholder');
            }
            this.createEventHandlers(['input', 'change', 'focus', 'blur'], props);
        }
    }
    exports.Input = Input;
});
define("nodes/li", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Li extends aurum_element_5.AurumElement {
        constructor(props) {
            super(props, 'li');
        }
    }
    exports.Li = Li;
});
define("nodes/span", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Span extends aurum_element_6.AurumElement {
        constructor(props) {
            super(props, 'span');
        }
    }
    exports.Span = Span;
});
define("nodes/style", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Style extends aurum_element_7.AurumElement {
        constructor(props) {
            super(props, 'style');
        }
    }
    exports.Style = Style;
});
define("nodes/ul", ["require", "exports", "nodes/aurum_element"], function (require, exports, aurum_element_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Ul extends aurum_element_8.AurumElement {
        constructor(props) {
            super(props, 'ul');
        }
    }
    exports.Ul = Ul;
});
define("aurum", ["require", "exports", "jsx/jsx_factory", "stream/array_data_source", "stream/data_source", "stream/event_emitter", "utilities/cancellation_token", "utilities/aurum", "nodes/aurum_element", "nodes/button", "nodes/div", "nodes/input", "nodes/li", "nodes/span", "nodes/style", "nodes/template", "nodes/ul"], function (require, exports, jsx_factory_1, array_data_source_2, data_source_3, event_emitter_2, cancellation_token_2, aurum_1, aurum_element_9, button_1, div_1, input_1, li_1, span_1, style_1, template_3, ul_1) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(jsx_factory_1);
    __export(array_data_source_2);
    __export(data_source_3);
    __export(event_emitter_2);
    __export(cancellation_token_2);
    __export(aurum_1);
    __export(aurum_element_9);
    __export(button_1);
    __export(div_1);
    __export(input_1);
    __export(li_1);
    __export(span_1);
    __export(style_1);
    __export(template_3);
    __export(ul_1);
});
//# sourceMappingURL=aurum.js.map