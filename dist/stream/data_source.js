export class DataSource {
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
//# sourceMappingURL=data_source.js.map