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
//# sourceMappingURL=data_source.js.map