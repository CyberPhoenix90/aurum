import { EventEmitter } from '../utilities/event_emitter';
/**
 * Datasources wrap a value and allow you to update it in an observable way. Datasources can be manipulated like streams and can be bound directly in the JSX syntax and will update the html whenever the value changes
 */
export class DataSource {
    constructor(initialValue) {
        this.value = initialValue;
        this.updateEvent = new EventEmitter();
    }
    /**
     * Updates the value in the data source and calls the listen callback for all listeners
     * @param newValue new value for the data source
     */
    update(newValue) {
        if (this.updating) {
            throw new Error('Problem in datas source: Unstable value propagation, when updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed');
        }
        this.updating = true;
        this.value = newValue;
        this.updateEvent.fire(newValue);
        this.updating = false;
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
     * Subscribes to the updates of the data stream
     * @param callback Callback to call when value is updated
     * @param cancellationToken Optional token to control the cancellation of the subscription
     * @returns Cancellation callback, can be used to cancel subscription without a cancellation token
     */
    listen(callback, cancellationToken) {
        return this.updateEvent.subscribe(callback, cancellationToken).cancel;
    }
    /**
     * Creates a new datasource that listenes to updates of this datasource but only propagates the updates from this source if they pass a predicate check
     * @param callback predicate check to decide if the update from the parent data source is passed down or not
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    filter(callback, cancellationToken) {
        const filteredSource = new DataSource();
        this.listen((value) => {
            if (callback(value, filteredSource.value)) {
                filteredSource.update(value);
            }
        }, cancellationToken);
        return filteredSource;
    }
    /**
     * Creates a new datasource that listenes to updates of this datasource but only propagates the updates from this source if they are larger than the previous value
     * In case of strings it checks alphabetical order when deciding what is bigger or smaller
     * @param callback predicate check to decide if the update from the parent data source is passed down or not
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    max(cancellationToken) {
        return this.filter((newValue, oldValue) => {
            if (typeof newValue === 'string' && typeof oldValue === 'string') {
                return newValue.localeCompare(oldValue) > 0;
            }
            else {
                return newValue > oldValue;
            }
        });
    }
    /**
     * Creates a new datasource that listenes to updates of this datasource but only propagates the updates from this source if they are smaller than the previous value
     * In case of strings it checks alphabetical order when deciding what is bigger or smaller
     * @param callback predicate check to decide if the update from the parent data source is passed down or not
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    min(cancellationToken) {
        return this.filter((newValue, oldValue) => {
            if (typeof newValue === 'string' && typeof oldValue === 'string') {
                return newValue.localeCompare(oldValue) < 0;
            }
            else {
                return newValue < oldValue;
            }
        });
    }
    /**
     * Forwards all updates from this source to another
     * @param targetDataSource datasource to pipe the updates to
     * @param cancellationToken  Cancellation token to cancel the subscription the target datasource has to this datasource
     */
    pipe(targetDataSource, cancellationToken) {
        this.listen((v) => targetDataSource.update(v), cancellationToken);
    }
    /**
     * Creates a new datasource that is listening to updates from this datasource and transforms them with a mapper function before fowarding them to itself
     * @param callback mapper function that transforms the updates of this source
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    map(callback, cancellationToken) {
        const mappedSource = new DataSource(callback(this.value));
        this.listen((value) => {
            mappedSource.update(callback(value));
        }, cancellationToken);
        return mappedSource;
    }
    /**
     * Allows tapping into the stream and calls a function for each value.
     */
    tap(callback, cancellationToken) {
        const tapSource = new DataSource(this.value);
        this.listen((value) => {
            callback(value);
            tapSource.update(value);
        }, cancellationToken);
        return tapSource;
    }
    /**
     * Creates a new datasource that is listening to updates from this datasource and transforms them with a mapper function before fowarding them to itself
     * @param callback mapper function that transforms the updates of this source
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    await(cancellationToken) {
        const mappedSource = new DataSource();
        this.listen(async (value) => {
            mappedSource.update(await value);
        }, cancellationToken);
        return mappedSource;
    }
    /**
     * Creates a new datasource that listens to this one and forwards updates if they are not the same as the last update
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    unique(cancellationToken) {
        const uniqueSource = new DataSource(this.value);
        this.listen((value) => {
            if (value !== uniqueSource.value) {
                uniqueSource.update(value);
            }
        }, cancellationToken);
        return uniqueSource;
    }
    /**
     * Creates a new datasource that listens to this one and forwards updates revealing the previous value on each update
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    diff(cancellationToken) {
        const diffingSource = new DataSource({
            new: this.value,
            old: undefined
        });
        this.listen((value) => {
            diffingSource.update({
                new: value,
                old: diffingSource.value
            });
        }, cancellationToken);
        return diffingSource;
    }
    /**
     * Creates a new datasource that listens to this source and combines all updates into a single value
     * @param reducer  function that aggregates an update with the previous result of aggregation
     * @param initialValue initial value given to the new source
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    reduce(reducer, initialValue, cancellationToken) {
        const reduceSource = new DataSource(initialValue);
        this.listen((v) => reduceSource.update(reducer(reduceSource.value, v)), cancellationToken);
        return reduceSource;
    }
    /**
     * Combines two sources into a third source that listens to updates from both parent sources.
     * @param otherSource Second parent for the new source
     * @param combinator Method allowing you to combine the data from both parents on update. Called each time a parent is updated with the latest values of both parents
     * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
     */
    aggregate(otherSource, combinator, cancellationToken) {
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
        const aggregatedSource = new DataSource(combinator(this.value, second.value, third.value, fourth.value));
        this.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
        second.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
        third.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
        fourth.listen(() => aggregatedSource.update(combinator(this.value, second.value, third.value, fourth.value)), cancellationToken);
        return aggregatedSource;
    }
    /**
     * Creates a new datasource that listens to this source and creates a string that contains all the updates with a seperator
     * @param seperator string to be placed between all the values
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    stringJoin(seperator, cancellationToken) {
        const joinSource = new DataSource('');
        this.listen((v) => joinSource.update(joinSource.value + seperator + v.toString()), cancellationToken);
        return joinSource;
    }
    /**
     * Like aggregate except that no combination method is needed as a result both parents must have the same type and the new stream just exposes the last update recieved from either parent
     * @param otherSource Second parent for the new source
     * @param cancellationToken  Cancellation token to cancel the subscriptions the new datasource has to the two parent datasources
     */
    combine(otherSources, cancellationToken) {
        const combinedDataSource = new DataSource();
        this.pipe(combinedDataSource, cancellationToken);
        for (const otherSource of otherSources) {
            otherSource.pipe(combinedDataSource, cancellationToken);
        }
        return combinedDataSource;
    }
    /**
     * Creates a datasource that forwards all the updates after a certain time has passed, useful to introduce a delay before something triggers. Does not debounce
     * @param time
     * @param cancellationToken
     */
    delay(time, cancellationToken) {
        const delayedDataSource = new DataSource(this.value);
        this.listen((v) => {
            setTimeout(() => {
                delayedDataSource.update(v);
            }, time);
        }, cancellationToken);
        return delayedDataSource;
    }
    /**
     * Creates a new source that listens to the updates of this source and forwards them to itself with a delay, in case many updates happen during this delay only the last update will be taken into account, effectively allowing to skip short lived values. Useful for optimizations
     * @param time Milliseconds to wait before updating
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    debounce(time, cancellationToken) {
        const debouncedDataSource = new DataSource(this.value);
        let timeout;
        this.listen((v) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                debouncedDataSource.update(v);
            }, time);
        }, cancellationToken);
        return debouncedDataSource;
    }
    /**
     * Creates a new source that listens to the updates of this source and forwards them to itself at most once per <time> milliseconds. In case many updates happen during the delay time only at most one update per delay will be taken into account,
     * effectively allowing to reduce load on the next stream. Useful for optimizations
     * @param time Milliseconds of cooldown after an update before another update can happen
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    throttle(time, cancellationToken) {
        const throttledDataSource = new DataSource(this.value);
        let cooldown = false;
        this.listen((v) => {
            if (!cooldown) {
                throttledDataSource.update(v);
                cooldown = true;
                setTimeout(() => {
                    cooldown = false;
                }, time);
            }
        }, cancellationToken);
        return throttledDataSource;
    }
    /**
     * Creates a new source that listens to the updates of this source. The updates are collected in an array for a period of time and then the new source updates with an array of all the updates collected in the timespan. Useful to take a rapidly changing source and process it a buffered manner. Can be used for things like batching network requests
     * @param time Milliseconds to wait before updating the returned source
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    buffer(time, cancellationToken) {
        const bufferedDataSource = new DataSource();
        let timeout;
        let buffer = [];
        this.listen((v) => {
            buffer.push(v);
            if (!timeout) {
                timeout = setTimeout(() => {
                    timeout = undefined;
                    bufferedDataSource.update(buffer);
                    buffer = [];
                }, time);
            }
        }, cancellationToken);
        return bufferedDataSource;
    }
    /**
     * Creates a new datasource that listens to the updates of this one. The datasource will accumulate all the updates from this source in form of an array data source. Useful to keep a history of all values from a source
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
    accumulate(cancellationToken) {
        const queueDataSource = new ArrayDataSource();
        this.listen((v) => {
            queueDataSource.push(v);
        }, cancellationToken);
        return queueDataSource;
    }
    /**
     * Creates a new datasource that listens to the updates of this source and forwards only a single key from the object that is held by this data source
     * @param key key to take from the object
     * @param cancellationToken  Cancellation token to cancel the subscription the new datasource has to this datasource
     */
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
    /**
     * Remove all listeners
     */
    cancelAll() {
        this.updateEvent.cancelAll();
    }
}
export class ArrayDataSource {
    constructor(initialData) {
        if (initialData) {
            this.data = initialData.slice();
        }
        else {
            this.data = [];
        }
        this.lengthSource = new DataSource(this.data.length).unique();
        this.updateEvent = new EventEmitter();
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
    listen(callback, cancellationToken) {
        return this.updateEvent.subscribe(callback, cancellationToken).cancel;
    }
    get length() {
        return this.lengthSource;
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
        this.update({ operation: 'replace', operationDetailed: 'replace', target: old, count: 1, index, items: [item], newState: this.data });
        this.lengthSource.update(this.data.length);
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
        this.lengthSource.update(this.data.length);
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
        this.lengthSource.update(this.data.length);
    }
    appendArray(items) {
        const old = this.data;
        this.data = new Array(old.length);
        let i = 0;
        for (i = 0; i < old.length; i++) {
            this.data[i] = old[i];
        }
        for (let n = 0; n < items.length; n++) {
            this.data[i + n] = items[n];
        }
        this.update({
            operation: 'add',
            operationDetailed: 'append',
            count: items.length,
            index: this.data.length - items.length,
            items,
            newState: this.data
        });
        this.lengthSource.update(this.data.length);
    }
    push(...items) {
        this.appendArray(items);
        this.lengthSource.update(this.data.length);
    }
    unshift(...items) {
        this.data.unshift(...items);
        this.update({ operation: 'add', operationDetailed: 'prepend', count: items.length, items, index: 0, newState: this.data });
        this.lengthSource.update(this.data.length);
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
        this.lengthSource.update(this.data.length);
        return item;
    }
    merge(newData) {
        for (let i = 0; i < newData.length; i++) {
            if (this.data[i] !== newData[i]) {
                if (this.data.length > i) {
                    this.set(i, newData[i]);
                }
                else {
                    this.push(newData[i]);
                }
            }
        }
        if (this.data.length > newData.length) {
            this.removeRight(this.data.length - newData.length);
        }
        this.lengthSource.update(this.data.length);
    }
    removeRight(count) {
        const length = this.data.length;
        const result = this.data.splice(length - count, count);
        this.update({ operation: 'remove', operationDetailed: 'removeRight', count, index: length - count, items: result, newState: this.data });
        this.lengthSource.update(this.data.length);
    }
    removeLeft(count) {
        const result = this.data.splice(0, count);
        this.update({ operation: 'remove', operationDetailed: 'removeLeft', count, index: 0, items: result, newState: this.data });
        this.lengthSource.update(this.data.length);
    }
    remove(item) {
        const index = this.data.indexOf(item);
        if (index !== -1) {
            this.data.splice(index, 1);
            this.update({ operation: 'remove', operationDetailed: 'remove', count: 1, index, items: [item], newState: this.data });
            this.lengthSource.update(this.data.length);
        }
    }
    clear() {
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
        this.lengthSource.update(this.data.length);
    }
    shift() {
        const item = this.data.shift();
        this.update({ operation: 'remove', operationDetailed: 'removeLeft', items: [item], count: 1, index: 0, newState: this.data });
        this.lengthSource.update(this.data.length);
        return item;
    }
    toArray() {
        return this.data.slice();
    }
    sort(comparator, cancellationToken) {
        return new SortedArrayView(this, comparator, cancellationToken);
    }
    map(mapper, cancellationToken) {
        return new MappedArrayView(this, mapper, cancellationToken);
    }
    filter(callback, dependencies = [], cancellationToken) {
        const view = new FilteredArrayView(this, callback, cancellationToken);
        dependencies.forEach((dep) => {
            dep.unique().listen(() => view.refresh());
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
export class MappedArrayView extends ArrayDataSource {
    constructor(parent, mapper, cancellationToken) {
        const initial = parent.getData().map(mapper);
        super(initial);
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
                case 'swap':
                    this.swap(change.index, change.index2);
                    break;
                case 'replace':
                    this.set(change.index, this.mapper(change.items[0]));
                    break;
            }
        }, cancellationToken);
    }
}
export class SortedArrayView extends ArrayDataSource {
    constructor(parent, comparator, cancellationToken) {
        const initial = parent.getData().sort(comparator);
        super(initial);
        this.comparator = comparator;
        parent.listen((change) => {
            switch (change.operationDetailed) {
                case 'removeLeft':
                    this.removeLeft(change.count);
                    break;
                case 'removeRight':
                    this.removeRight(change.count);
                    break;
                case 'remove':
                    this.remove(change.items[0]);
                    break;
                case 'clear':
                    this.data.length = 0;
                    break;
                case 'prepend':
                    this.unshift(...change.items);
                    this.data.sort(this.comparator);
                    break;
                case 'append':
                    this.push(...change.items);
                    this.data.sort(this.comparator);
                    break;
                case 'swap':
                    break;
                case 'replace':
                    this.set(change.index, change.items[0]);
                    this.data.sort(this.comparator);
                    break;
            }
        }, cancellationToken);
    }
}
export class FilteredArrayView extends ArrayDataSource {
    constructor(parent, filter, cancellationToken) {
        if (Array.isArray(parent)) {
            parent = new ArrayDataSource(parent);
        }
        filter = filter !== null && filter !== void 0 ? filter : (() => true);
        const initial = parent.data.filter(filter);
        super(initial);
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
        this.clear();
        const data = this.parent.data.filter(this.viewFilter);
        this.push(...data);
    }
}
//# sourceMappingURL=data_source.js.map