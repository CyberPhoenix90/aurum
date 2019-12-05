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
    pick(key, cancellationToken) {
        var _a;
        const subDataSource = new DataSource((_a = this.data) === null || _a === void 0 ? void 0 : _a[key]);
        this.listenOnKey(key, (v) => {
            subDataSource.update(v.newValue);
        }, cancellationToken);
        return subDataSource;
    }
    listen(callback, cancellationToken) {
        return this.updateEvent.subscribe(callback, cancellationToken).cancel;
    }
    listenOnKeyAndRepeat(key, callback, cancellationToken) {
        callback({
            key,
            newValue: this.data[key],
            oldValue: undefined
        });
        return this.listenOnKey(key, callback, cancellationToken);
    }
    listenOnKey(key, callback, cancellationToken) {
        if (!this.updateEventOnKey.has(key)) {
            this.updateEventOnKey.set(key, new EventEmitter());
        }
        const event = this.updateEventOnKey.get(key);
        return event.subscribe(callback, cancellationToken).cancel;
    }
    get(key) {
        return this.data[key];
    }
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
    assign(newData) {
        for (const key of Object.keys(newData)) {
            this.set(key, newData[key]);
        }
    }
    toObject() {
        return Object.assign({}, this.data);
    }
    toDataSource() {
        const stream = new DataSource(this.data);
        this.listen((s) => {
            stream.update(this.data);
        });
        return stream;
    }
}
//# sourceMappingURL=object_data_source.js.map