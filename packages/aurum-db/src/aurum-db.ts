import { AbstractIteratorOptions } from 'abstract-leveldown';
import { MapDataSource, DataSource, CancellationToken } from 'aurumjs';
import * as level from 'level';
import { LevelUp } from 'levelup';
import * as sub from 'subleveldown';
import { META_KEY } from './constants';
import { AurumDBOrderedCollection } from './datastructures/ordered_list';
import { AurumDBStreamableIndex } from './datastructures/streamable_index';
import { AurumDBIterator } from './iterator';
import { Encodings } from './leveldb';
import { AbstractBatch } from 'abstract-leveldown';

type AurumDBIntegrityConfig = {
    autoDeleteOnSetUndefined?: boolean;
};

interface AurumDBConfig {
    path: string;
    integrity?: AurumDBIntegrityConfig;
}

export * from './iterator';
export * from './datastructures/ordered_list';
export * from './datastructures/streamable_index';

export async function initializeDatabase(config: AurumDBConfig): Promise<AurumDB> {
    const db = await level(config.path);

    return new AurumDB(
        db,
        config.integrity ?? {
            autoDeleteOnSetUndefined: false
        }
    );
}

function makeSubDbId(subDbName: string, id: string): string {
    return `!${subDbName}!${id}`;
}

export interface BatchOperation {
    type: 'put' | 'del';
    key: string;
    value: any;
}

export class AurumDB {
    protected config: AurumDBIntegrityConfig;
    protected db: LevelUp;

    constructor(db: LevelUp, config: AurumDBIntegrityConfig) {
        this.config = config;
        this.db = db;
    }

    public iterator(options?: AbstractIteratorOptions): AurumDBIterator<any> {
        return new AurumDBIterator<any>(this.db.iterator(options));
    }

    public clear(): Promise<void> {
        return this.db.clear();
    }

    public async deleteIndex(name: string): Promise<void> {
        const index = await this.getIndex(name, undefined);
        await index.db.clear();
    }

    public async deleteOrderedCollection(name: string): Promise<void> {
        return ((await this.getOrderedCollection(name)) as any).db.clear();
    }

    public async deletedLinkedCollection(name: string): Promise<void> {
        return ((await this.getLinkedCollection(name)) as any).db.clear();
    }

    public batch(batchOperations: BatchOperation[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.db.batch(batchOperations, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public hasIndex(name: string): Promise<boolean> {
        return this.has(makeSubDbId(name + DataTypeKeyPrefix.index, META_KEY));
    }

    public hasOrderedCollection(name: string): Promise<boolean> {
        return this.has(makeSubDbId(name + DataTypeKeyPrefix.orderedCollection, META_KEY));
    }

    public hasLinkedCollection(name: string): Promise<boolean> {
        return this.has(makeSubDbId(name + DataTypeKeyPrefix.linkedCollection, META_KEY));
    }

    public async has(key: string): Promise<boolean> {
        try {
            await this.db.get(key);
        } catch (e) {
            if (e.message.includes('Key not found in database')) {
                return false;
            } else {
                throw e;
            }
        }
        return true;
    }

    public async getIndex<T>(name: string, encoding: Encodings): Promise<AurumDBIndex<T>> {
        if (await this.hasIndex(name)) {
            return new AurumDBIndex<T>(
                sub(this.db, name + DataTypeKeyPrefix.index, {
                    valueEncoding: encoding
                }),
                this.config
            );
        } else {
            throw new Error(`Index ${name} does not exist`);
        }
    }

    public async createOrGetIndex<T>(name: string, defaultEncoding?: Encodings): Promise<AurumDBIndex<T>> {
        if (await this.hasIndex(name)) {
            return new AurumDBIndex<T>(
                sub(this.db, name + DataTypeKeyPrefix.index, {
                    valueEncoding: defaultEncoding
                }),
                this.config
            );
        } else {
            return this.createIndex(name, defaultEncoding);
        }
    }

    public async deleteStreamableIndex(name: string): Promise<void> {
        const index = await this.getStreamableIndex(name);
        //@ts-ignore
        await index.db.clear();
    }

    public hasStreamableIndex(name: string): Promise<boolean> {
        return this.has(makeSubDbId(name + DataTypeKeyPrefix.streamableIndex, META_KEY));
    }

    public async getStreamableIndex<T>(name: string): Promise<AurumDBStreamableIndex<T>> {
        if (await this.hasStreamableIndex(name)) {
            return new AurumDBStreamableIndex(sub(this.db, name + DataTypeKeyPrefix.streamableIndex));
        } else {
            throw new Error(`Index ${name} does not exist`);
        }
    }

    public async createOrGetStreamableIndex<T>(name: string): Promise<AurumDBStreamableIndex<T>> {
        if (await this.hasStreamableIndex(name)) {
            return new AurumDBStreamableIndex(sub(this.db, name + DataTypeKeyPrefix.streamableIndex, {}));
        } else {
            return this.createStreamableIndex(name);
        }
    }

    /**
     * A streamable index is very similar to an index, the advantage is that values can be streamed both when writing and reading, the downside is that the values must be binary
     * Suitable use cases: Storing large binary blobs, storing video, storing images, storing any value too large to fit in memory
     * Unsuitable use cases: Storing lots of small values, storing non streamable data types such as json
     */
    public async createStreamableIndex<T>(name: string): Promise<AurumDBStreamableIndex<T>> {
        if (await this.hasStreamableIndex(name)) {
            throw new Error(`Streamable Index ${name} already exists`);
        }
        name += DataTypeKeyPrefix.streamableIndex;
        await this.db.put(makeSubDbId(name, META_KEY), new Date().toJSON(), {
            valueEncoding: 'json'
        });
        return new AurumDBStreamableIndex(sub(this.db, name));
    }

    public async getOrderedCollection<T>(name: string): Promise<AurumDBOrderedCollection<T>> {
        if (await this.hasOrderedCollection(name)) {
            return new AurumDBOrderedCollection<T>(sub(this.db, name + DataTypeKeyPrefix.orderedCollection));
        } else {
            throw new Error(`Ordered collection ${name} does not exist`);
        }
    }

    public async createOrGetOrderedCollection<T>(name: string, defaultEncoding?: Encodings): Promise<AurumDBOrderedCollection<T>> {
        if (await this.hasOrderedCollection(name)) {
            return new AurumDBOrderedCollection<T>(
                sub(this.db, name + DataTypeKeyPrefix.orderedCollection, {
                    valueEncoding: defaultEncoding
                })
            );
        } else {
            return this.createOrderedCollection(name, defaultEncoding);
        }
    }

    public async getLinkedCollection<T>(name: string): Promise<AurumDBLinkedCollection<T>> {
        if (await this.hasLinkedCollection(name)) {
            return new AurumDBLinkedCollection<T>(sub(this.db, name + DataTypeKeyPrefix.linkedCollection));
        } else {
            throw new Error(`Linked collection ${name} does not exist`);
        }
    }

    public async createOrGetLinkedCollection<T>(name: string): Promise<AurumDBLinkedCollection<T>> {
        if (await this.hasLinkedCollection(name)) {
            return new AurumDBLinkedCollection<T>(sub(this.db, name + DataTypeKeyPrefix.linkedCollection));
        } else {
            return this.createLinkedCollection(name);
        }
    }

    /**
     * An index is a basically a hashmap, each item is referred by key, however you can also iterate over the entire set of key values
     * Suitable use cases: Unordered lists, Hash maps, Nested Hash maps
     * Unsuitable use cases: Stacks, Ordered lists, Queues, storing large values (>50 MB), Storing video, Storing images
     */
    public async createIndex<T>(name: string, defaultEncoding?: Encodings): Promise<AurumDBIndex<T>> {
        if (await this.hasIndex(name)) {
            throw new Error(`Index ${name} already exists`);
        }
        name += DataTypeKeyPrefix.index;
        await this.db.put(makeSubDbId(name, META_KEY), new Date().toJSON(), {
            valueEncoding: 'json'
        });
        return new AurumDBIndex<T>(
            sub(this.db, name, {
                valueEncoding: defaultEncoding
            }),
            this.config
        );
    }

    /**
     * An ordered collection is basically an array, all items have a numerical index. Delete and Insert of items that are not the last one in the array can be very expensive. Write operations lock the entire collection due to lack of thread safetly.
     * Suitable use cases: Stacks, Append only list, Random access lists
     * Unsuitable: Queues, Hash Maps, storing large values (>50 MB), Storing video, Storing images
     */
    public async createOrderedCollection<T>(name: string, defaultEncoding?: Encodings): Promise<AurumDBOrderedCollection<T>> {
        if (await this.hasOrderedCollection(name)) {
            throw new Error(`Ordered Collection ${name} already exists`);
        }
        name += DataTypeKeyPrefix.orderedCollection;
        await this.db.put(makeSubDbId(name, META_KEY), 0, {
            valueEncoding: 'json'
        });
        return new AurumDBOrderedCollection<T>(
            sub(this.db, name, {
                valueEncoding: defaultEncoding
            })
        );
    }

    /**
     * A linked collection is basically a linked list. Delete and Insert of items is relatively cheap. Write operations lock only part of the collection. Iteration is fine, but random access is expensive
     * Suitable use cases: Queues, Stacks, Append only list (but ordered collection is faster for that)
     * Unsuitable: Random access lists, Hash Maps, storing large values (>50 MB), Storing video, Storing images
     */
    public async createLinkedCollection<T>(name: string): Promise<AurumDBLinkedCollection<T>> {
        if (await this.hasLinkedCollection(name)) {
            throw new Error(`Linked Collection ${name} already exists`);
        }
        name += DataTypeKeyPrefix.linkedCollection;
        await this.db.put(makeSubDbId(name, META_KEY), 0, {
            valueEncoding: 'json'
        });
        return new AurumDBLinkedCollection<T>(sub(this.db, name));
    }
}

export class AurumDBLinkedCollection<T> {
    protected db: LevelUp;

    constructor(db: LevelUp) {
        this.db = db;
    }

    public clear(): Promise<void> {
        return this.db.clear();
    }
}

export class AurumDBIndex<T> extends AurumDB {
    private totalObservers: MapDataSource<string, any>[];
    private keyObservers: Map<string, DataSource<any>[]>;

    constructor(db: LevelUp, config: AurumDBIntegrityConfig) {
        super(db, config);
        this.totalObservers = [];
        this.keyObservers = new Map();
        this.db.on('batch', (ops: AbstractBatch[]) => {
            for (const op of ops) {
                switch (op.type) {
                    case 'put':
                        this.onKeyChange(op.key, op.value);
                        break;
                    case 'del':
                        this.onKeyChange(op.key, undefined);
                        break;
                    //@ts-ignore
                    case 'clear':
                        this.onClear();
                        break;
                    default:
                        throw new Error('unhandled operation');
                }
            }
        });
        this.db.on('clear', () => {
            this.onClear();
        });

        this.db.on('put', (k, v) => {
            this.onKeyChange(k, v);
        });
        this.db.on('del', (k) => {
            this.onKeyChange(k, undefined);
        });
    }

    public iterator(options?: AbstractIteratorOptions): AurumDBIterator<T> {
        return new AurumDBIterator<T>(this.db.iterator(options));
    }

    private onClear(): void {
        for (const mds of this.totalObservers) {
            for (const k of mds.keys()) {
                mds.delete(k);
            }
        }

        for (const dss of this.keyObservers.values()) {
            for (const ds of dss) {
                ds.update(undefined);
            }
        }
    }

    private onKeyChange(k: string, v: T): void {
        for (const mds of this.totalObservers) {
            if (v === undefined) {
                mds.delete(k);
            } else {
                mds.set(k, v);
            }
        }
        if (this.keyObservers.has(k)) {
            for (const ds of this.keyObservers.get(k)) {
                ds.update(v);
            }
        }
    }

    /**
     * Caution: While this is very useful for reactivity this has a high cost, it has to read the entire index to get started, if your index is huge this may even make your application go out of memory, to be used only with moderate sized indexes.
     * Suggested max size: 5k entries. For larger data sets consider chunking your data with sub indexes
     */
    public async observeEntireIndex(cancellationToken: CancellationToken, valueEncoding?: Encodings): Promise<MapDataSource<string, T>> {
        const iter = this.iterator({});
        const result = new MapDataSource<string, T>();
        this.totalObservers.push(result);
        cancellationToken.addCancelable(() => {
            const index = this.totalObservers.indexOf(result);
            if (index !== -1) {
                this.totalObservers.splice(index, 1);
            }
        });

        while (await iter.next()) {
            const { key, value } = iter.current;
            result.set(key, value);
        }
        return result;
    }

    public async observeKey(key: string, cancellationToken: CancellationToken, valueEncoding?: Encodings): Promise<DataSource<T>> {
        const ds = new DataSource<T>();

        if (await this.has(key)) {
            ds.update(await this.get(key, valueEncoding));
        }

        if (!this.keyObservers.has(key)) {
            this.keyObservers.set(key, []);
        }
        this.keyObservers.get(key).push(ds);
        cancellationToken.addCancelable(() => {
            const dss = this.keyObservers.get(key);
            const index = dss.indexOf(ds);
            if (index !== -1) {
                dss.splice(index, 1);
            }
        });

        return ds;
    }

    public get(key: string, overrideEncoding?: Encodings): Promise<T> {
        return this.db.get(key, {
            valueEncoding: overrideEncoding
        });
    }

    public set(key: string, value: T, overrideEncoding?: Encodings): Promise<void> {
        if (this.config.autoDeleteOnSetUndefined && (value === undefined || value === null)) {
            return this.db.del(key);
        } else {
            return this.db.put(key, value, { valueEncoding: overrideEncoding });
        }
    }

    public delete(key: string): Promise<void> {
        return this.db.del(key);
    }

    public async clear(): Promise<void> {
        const val = await this.get(META_KEY, 'json');
        await this.db.clear();
        await this.set(META_KEY, val, 'json');
    }
}

enum DataTypeKeyPrefix {
    index = 'index',
    streamableIndex = 'streamableIndex',
    orderedCollection = 'ordered',
    linkedCollection = 'linked'
}
