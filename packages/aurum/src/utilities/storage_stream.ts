import { ArrayDataSource, SetDataSource } from '../stream/data_source.js';
import { DuplexDataSource } from '../stream/duplex_data_source.js';
import { CancellationToken } from './cancellation_token.js';
import { EventEmitter } from './event_emitter.js';
import { UrlStorage } from './url_storage.js';

export class StorageStream {
    public readonly storageAPI: Storage;
    private onChange: EventEmitter<{ key: string; value: string }>;
    private originalSetItem: (key: string, value: string) => void;
    private originalRemoveItem: (key: string) => void;

    constructor(storageAPI: Storage) {
        this.onChange = new EventEmitter<{ key: string; value: string }>();
        this.storageAPI = storageAPI;
        this.observeStorageAPI(storageAPI);
    }

    private observeStorageAPI(storageAPI: Storage): void {
        this.originalSetItem = storageAPI.setItem.bind(storageAPI);
        storageAPI.setItem = (key: string, value: any) => {
            this.originalSetItem(key, value);
            this.onChange.fire({ key, value });
        };

        this.originalRemoveItem = storageAPI.removeItem.bind(storageAPI);
        storageAPI.removeItem = (key: string) => {
            this.originalRemoveItem(key);
            this.onChange.fire({ key, value: undefined });
        };

        const originalClear = storageAPI.clear.bind(storageAPI);
        storageAPI.clear = () => {
            originalClear();
            this.onChange.fire({ key: '*', value: undefined });
        };
    }

    public listenAsString(key: string, defaultValue: string, cancellationToken?: CancellationToken): DuplexDataSource<string> {
        const stream = new DuplexDataSource<string>().withInitial(this.storageAPI.getItem(key) ?? defaultValue);

        this.onChange.subscribe((e) => {
            if (e.key === key || e.key === '*') {
                stream.updateDownstream(e.value ?? defaultValue);
            }
        }, cancellationToken);

        stream.listenUpstream((v) => {
            if (v === undefined || v === defaultValue) {
                this.originalRemoveItem(key);
            } else {
                this.originalSetItem(key, v);
            }
        }, cancellationToken);

        return stream;
    }

    public listenAsNumber(key: string, defaultValue: number, cancellationToken?: CancellationToken, radix: number = 10): DuplexDataSource<number> {
        const stream = new DuplexDataSource<number>().withInitial(this.storageAPI.getItem(key) ? parseInt(this.storageAPI.getItem(key), radix) : defaultValue);

        this.onChange.subscribe((e) => {
            if (e.key === key || e.key === '*') {
                stream.updateDownstream(e.value != undefined ? parseInt(e.value, radix) : defaultValue);
            }
        }, cancellationToken);

        stream.listenUpstream((v) => {
            if (v === undefined || v === defaultValue) {
                this.originalRemoveItem(key);
            } else {
                this.originalSetItem(key, v.toString());
            }
        }, cancellationToken);

        return stream;
    }

    public listenAsDate(key: string, defaultValue: Date, cancellationToken?: CancellationToken): DuplexDataSource<Date> {
        const stream = new DuplexDataSource<Date>().withInitial(this.storageAPI.getItem(key) ? new Date(this.storageAPI.getItem(key)) : defaultValue);

        this.onChange.subscribe((e) => {
            if (e.key === key || e.key === '*') {
                stream.updateDownstream(e.value != undefined ? new Date(e.value) : defaultValue);
            }
        }, cancellationToken);

        stream.listenUpstream((v) => {
            if (v === undefined || v === defaultValue) {
                this.originalRemoveItem(key);
            } else {
                this.originalSetItem(key, v.toJSON());
            }
        }, cancellationToken);

        return stream;
    }

    public listenAsBoolean(key: string, defaultValue: boolean, cancellationToken?: CancellationToken): DuplexDataSource<boolean> {
        const stream = new DuplexDataSource<boolean>().withInitial(this.storageAPI.getItem(key) ? this.storageAPI.getItem(key) === 'true' : defaultValue);

        this.onChange.subscribe((e) => {
            if (e.key === key || e.key === '*') {
                stream.updateDownstream(e.value != undefined ? e.value === 'true' : defaultValue);
            }
        }, cancellationToken);

        stream.listenUpstream((v) => {
            if (v === undefined || v === defaultValue) {
                this.originalRemoveItem(key);
            } else {
                this.originalSetItem(key, v.toString());
            }
        }, cancellationToken);

        return stream;
    }

    // Since objects can be mutable a provider can be used to regenerate the object on each use of the default value
    public listenAsObject<T>(key: string, defaultValueOrProvider: T | (() => T), cancellationToken?: CancellationToken): DuplexDataSource<T> {
        const stream = new DuplexDataSource<T>().withInitial(
            this.storageAPI.getItem(key)
                ? JSON.parse(this.storageAPI.getItem(key))
                : typeof defaultValueOrProvider === 'function'
                ? (defaultValueOrProvider as () => T)()
                : defaultValueOrProvider
        );

        this.onChange.subscribe((e) => {
            if (e.key === key || e.key === '*') {
                stream.updateDownstream(
                    e.value != undefined
                        ? JSON.parse(e.value)
                        : typeof defaultValueOrProvider === 'function'
                        ? (defaultValueOrProvider as () => T)()
                        : defaultValueOrProvider
                );
            }
        }, cancellationToken);

        stream.listenUpstream((v) => {
            if (v === undefined) {
                this.originalRemoveItem(key);
            } else {
                this.originalSetItem(key, JSON.stringify(v));
            }
        }, cancellationToken);

        return stream;
    }

    public listenAsEnum<T>(
        key: string,
        enumValues: Record<string, string | number>,
        defaultValue: T,
        cancellationToken?: CancellationToken
    ): DuplexDataSource<T> {
        const stream = new DuplexDataSource<T>().withInitial(parseValue(this.storageAPI.getItem(key)));

        this.onChange.subscribe((e) => {
            if (e.key === key || e.key === '*') {
                stream.updateDownstream(parseValue(e.value));
            }
        }, cancellationToken);

        stream.listenUpstream((v) => {
            if (v === undefined || v === defaultValue) {
                this.originalRemoveItem(key);
            } else {
                this.originalSetItem(key, v.toString());
            }
        }, cancellationToken);

        return stream;

        function parseValue(value: any): T {
            if (value === undefined || value === null) {
                return defaultValue;
            } else if (typeof defaultValue === 'number') {
                const candidate = parseInt(value) as unknown as T;
                if (Number.isNaN(candidate) || (candidate as any) in enumValues === false) {
                    return defaultValue;
                } else {
                    return candidate;
                }
            } else {
                const candidate = value as unknown as T;
                if ((candidate as any) in enumValues === false) {
                    return defaultValue;
                } else {
                    return candidate;
                }
            }
        }
    }

    public listenAsArray<T>(key: string, cancellationToken?: CancellationToken): ArrayDataSource<T> {
        const stream = new ArrayDataSource<T>(JSON.parse(this.storageAPI.getItem(key) ?? '[]'));

        this.onChange.subscribe((e) => {
            if (e.key === key || e.key === '*') {
                stream.merge(e.value != undefined ? JSON.parse(e.value) : []);
            }
        }, cancellationToken);

        stream.listen((v) => {
            this.originalSetItem(key, JSON.stringify(v.newState));
        }, cancellationToken);

        return stream;
    }

    public listenAsSet<T>(key: string, cancellationToken?: CancellationToken): SetDataSource<T> {
        const stream = new SetDataSource<T>(JSON.parse(this.storageAPI.getItem(key) ?? '[]'));

        this.onChange.subscribe((e) => {
            if (e.key === key || e.key === '*') {
                stream.merge(e.value != undefined ? JSON.parse(e.value) : []);
            }
        }, cancellationToken);

        stream.listen((v) => {
            this.originalSetItem(key, JSON.stringify(stream.toArray()));
        }, cancellationToken);

        return stream;
    }
}

export let localStorageStream: StorageStream;
if (typeof localStorage !== 'undefined') {
    localStorageStream = new StorageStream(localStorage);
}
export let sessionStorageStream: StorageStream;
if (typeof sessionStorage !== 'undefined') {
    sessionStorageStream = new StorageStream(sessionStorage);
}
export let urlStorageStream: StorageStream;
if (typeof location !== 'undefined' && typeof History !== 'undefined' && typeof URLSearchParams !== 'undefined') {
    urlStorageStream = new StorageStream(new UrlStorage());
}
