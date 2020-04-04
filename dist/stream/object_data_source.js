import { DataSource } from './data_source';
import { EventEmitter } from '../utilities/event_emitter';
export class ObjectDataSource {
    constructor(initialData) {
        if (initialData) {
            this.data = initialData;
        }
        this.updateEvent = new EventEmitter();
        this.updateEventOnKey = new Map();
    }
    /**
     * Creates a datasource for a single key of the object
     * @param key
     * @param cancellationToken
     */
    pick(key, cancellationToken) {
        var _a;
        const subDataSource = new DataSource((_a = this.data) === null || _a === void 0 ? void 0 : _a[key]);
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
            this.updateEventOnKey.set(key, new EventEmitter());
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
    delete(key, value) {
        const old = this.data[key];
        delete this.data[key];
        this.updateEvent.fire({ oldValue: old, key, newValue: undefined, deleted: true });
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
        for (const key of Object.keys(newData)) {
            this.set(key, newData[key]);
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
        const stream = new DataSource(this.data);
        this.listen((s) => {
            stream.update(this.data);
        });
        return stream;
    }
}
//# sourceMappingURL=object_data_source.js.map