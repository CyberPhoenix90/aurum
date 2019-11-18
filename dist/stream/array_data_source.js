import { EventEmitter } from './event_emitter';
import { DataSource } from './data_source';
export class ArrayDataSource {
    constructor(initialData) {
        if (initialData) {
            this.data = initialData.slice();
        }
        else {
            this.data = [];
        }
        this.onChange = new EventEmitter();
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
        const stream = new DataSource(this.data);
        this.onChange.subscribe((s) => {
            stream.update(s.newState);
        });
        return stream;
    }
}
export class FilteredArrayView extends ArrayDataSource {
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
//# sourceMappingURL=array_data_source.js.map