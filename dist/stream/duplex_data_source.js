import { EventEmitter } from '../utilities/event_emitter';
export var DataFlow;
(function (DataFlow) {
    DataFlow[DataFlow["UPSTREAM"] = 0] = "UPSTREAM";
    DataFlow[DataFlow["DOWNSTREAM"] = 1] = "DOWNSTREAM";
})(DataFlow || (DataFlow = {}));
export class DuplexDataSource {
    constructor(initialValue) {
        this.value = initialValue;
        this.updateDownstreamEvent = new EventEmitter();
        this.updateUpstreamEvent = new EventEmitter();
    }
    static fromTwoDataSource(downStream, upstream, initialValue) {
        const result = new DuplexDataSource(initialValue);
        result.updateDownstreamEvent = downStream.updateEvent;
        result.updateUpstreamEvent = upstream.updateEvent;
    }
    static createOneWay(direction = DataFlow.DOWNSTREAM, initialValue) {
        return new DuplexDataSource(initialValue).oneWayFlow(direction);
    }
    updateDownstream(newValue) {
        if (this.updating) {
            throw new Error('Problem in datas source: Unstable value propagation, when updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed');
        }
        this.updating = true;
        this.value = newValue;
        this.updateDownstreamEvent.fire(newValue);
        this.updating = false;
    }
    updateUpstream(newValue) {
        if (this.updating) {
            throw new Error('Problem in datas source: Unstable value propagation, when updating a value the stream was updated back as a direct response. This can lead to infinite loops and is therefore not allowed');
        }
        this.updating = true;
        this.value = newValue;
        this.updateUpstreamEvent.fire(newValue);
        this.updating = false;
    }
    listenAndRepeat(callback, cancellationToken) {
        callback(this.value);
        return this.listen(callback, cancellationToken);
    }
    listen(callback, cancellationToken) {
        this.updateDownstreamEvent.subscribe(callback, cancellationToken).cancel;
        return this.updateUpstreamEvent.subscribe(callback, cancellationToken).cancel;
    }
    listenUpstream(callback, cancellationToken) {
        return this.updateUpstreamEvent.subscribe(callback, cancellationToken).cancel;
    }
    listenDownstream(callback, cancellationToken) {
        return this.updateDownstreamEvent.subscribe(callback, cancellationToken).cancel;
    }
    filter(downStreamFilter, upstreamFilter, cancellationToken) {
        if (!upstreamFilter) {
            upstreamFilter = downStreamFilter;
        }
        const filteredSource = new DuplexDataSource();
        this.listenDownstream((newVal) => {
            if (downStreamFilter(newVal)) {
                filteredSource.updateDownstream(newVal);
            }
        }, cancellationToken);
        filteredSource.listenUpstream((newVal) => {
            if (((upstreamFilter !== null && upstreamFilter !== void 0 ? upstreamFilter : downStreamFilter))(newVal)) {
                this.updateUpstream(newVal);
            }
        }, cancellationToken);
        return filteredSource;
    }
    pipe(targetDataSource, cancellationToken) {
        this.listenDownstream((newVal) => targetDataSource.updateDownstream(newVal), cancellationToken);
        targetDataSource.listenUpstream((newVal) => this.updateUpstream(newVal), cancellationToken);
    }
    map(mapper, reverseMapper, cancellationToken) {
        const mappedSource = new DuplexDataSource(mapper(this.value));
        this.listenDownstream((v) => mappedSource.updateDownstream(mapper(v)), cancellationToken);
        mappedSource.listenUpstream((v) => this.updateUpstream(reverseMapper(v)), cancellationToken);
        return mappedSource;
    }
    unique(cancellationToken) {
        const uniqueSource = new DuplexDataSource(this.value);
        this.listenDownstream((v) => {
            if (uniqueSource.value !== v) {
                uniqueSource.updateDownstream(v);
            }
        }, cancellationToken);
        uniqueSource.listenUpstream((v) => {
            if (this.value !== v) {
                this.updateUpstream(v);
            }
        }, cancellationToken);
        return uniqueSource;
    }
    oneWayFlow(direction = DataFlow.DOWNSTREAM, cancellationToken) {
        const oneWaySource = new DuplexDataSource(this.value);
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
    cancelAll() {
        this.updateDownstreamEvent.cancelAll();
        this.updateUpstreamEvent.cancelAll();
    }
}
//# sourceMappingURL=duplex_data_source.js.map