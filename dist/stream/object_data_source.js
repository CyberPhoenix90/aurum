import { DataSource } from './data_source';
export class ObjectDataSource {
    constructor(initialData) {
        if (initialData) {
            this.data = initialData;
        }
        this.listeners = [];
        this.listenersOnKey = new Map();
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
    listenOnKeyAndRepeat(key, callback, cancellationToken) {
        callback({
            key,
            newValue: this.data[key],
            oldValue: undefined
        });
        return this.listenOnKey(key, callback, cancellationToken);
    }
    listenOnKey(key, callback, cancellationToken) {
        var _a;
        if (!this.listenersOnKey.has(key)) {
            this.listenersOnKey.set(key, []);
        }
        const listeners = this.listenersOnKey.get(key);
        listeners.push(callback);
        const cancel = () => {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        };
        (_a = cancellationToken) === null || _a === void 0 ? void 0 : _a.addCancelable(() => {
            cancel();
        });
        return cancel;
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
        for (const l of this.listeners) {
            l({ oldValue: old, key, newValue: this.data[key] });
        }
        if (this.listenersOnKey.has(key)) {
            for (const l of this.listenersOnKey.get(key)) {
                l({ oldValue: old, key, newValue: this.data[key] });
            }
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