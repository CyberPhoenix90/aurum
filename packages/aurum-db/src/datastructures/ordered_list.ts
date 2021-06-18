import { ArrayDataSource, DataSource, CancellationToken } from 'aurumjs';
import { AbstractBatch } from 'abstract-leveldown';
import { LevelUp } from 'levelup';
import { META_KEY } from '../constants';
import { AurumDBIterator } from '../iterator';

export class AurumDBOrderedCollection<T> {
    private totalObservers: ArrayDataSource<T>[];
    private keyObservers: Map<string, DataSource<any>[]>;
    private db: LevelUp;
    private lock: Promise<any>;

    constructor(db: LevelUp) {
        this.db = db;
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

    private onClear(): void {
        for (const dss of this.keyObservers.values()) {
            for (const ds of dss) {
                ds.update(undefined);
            }
        }
    }

    private onKeyChange(k: any, v: any) {
        if (this.keyObservers.has(k)) {
            for (const ds of this.keyObservers.get(k)) {
                ds.update(v);
            }
        }
    }

    public observeLength(cancellationToken: CancellationToken): Promise<DataSource<number>> {
        return this.observeKey(META_KEY, cancellationToken);
    }

    public observeAt(index: number, cancellationToken: CancellationToken): Promise<DataSource<T>> {
        return this.observeKey(index.toString(), cancellationToken);
    }

    private async observeKey(key: string, cancellationToken: CancellationToken): Promise<DataSource<any>> {
        await this.lock;
        const ds = new DataSource<any>();

        try {
            const v = await this.db.get(key, { valueEncoding: 'json' });
            ds.update(v);
        } catch (e) {}

        if (!this.keyObservers.has(key)) {
            this.keyObservers.set(key, []);
        }
        console.log(`listen ${key}`);
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

    /**
     * Caution: This has to read the entire collection from the database on initialization which may be slow and memory intensive. Not recommended for collections with over 5k entries
     */
    public async observeEntireCollection(cancellationToken: CancellationToken): Promise<ArrayDataSource<T>> {
        await this.lock;
        const ads = new ArrayDataSource(await this.toArray());

        this.totalObservers.push(ads);
        cancellationToken.addCancelable(() => {
            const index = this.totalObservers.indexOf(ads);
            if (index !== -1) {
                this.totalObservers.splice(index, 1);
            }
        });

        return ads;
    }

    /**
     * Creates an array datasource that contains the last N elements inside this ordered collection. Useful for cases where you need to observe the latest of a list of transactions or events
     */
    public async observeLastNElements(amount: number, cancellationToken: CancellationToken): Promise<ArrayDataSource<T>> {
        await this.lock;
        const len = await this.length();
        const ads = new ArrayDataSource<T>();
        for (let i = Math.max(0, len - amount); i < len; i++) {
            ads.push(await this.get(i));
        }

        this.totalObservers.push(ads);
        cancellationToken.addCancelable(() => {
            const index = this.totalObservers.indexOf(ads);
            if (index !== -1) {
                this.totalObservers.splice(index, 1);
            }
        });

        return ads;
    }

    public async length(): Promise<number> {
        await this.lock;
        return await this.db.get(META_KEY, { valueEncoding: 'json' });
    }

    public async get(index: number): Promise<T> {
        await this.lock;
        const len = await this.length();
        if (index > len) {
            throw new Error('cannot read outside of bounds of array');
        }
        return this.db.get(index);
    }

    public async set(index: number, item: T): Promise<void> {
        await this.lock;
        const len = await this.length();
        if (index > len) {
            throw new Error('cannot write outside of bounds of array');
        }

        for (const ads of this.totalObservers) {
            ads.set(index, item);
        }
        return this.db.put(index, item);
    }

    public async push(...items: T[]): Promise<void> {
        await this.lock;
        this.lock = new Promise(async (resolve) => {
            const len = await this.length();
            const batch = this.db.batch();
            for (let i = 0; i < items.length; i++) {
                batch.put(`${len + i}`, items[i]);
            }
            batch.put(META_KEY, len + items.length);
            for (const ads of this.totalObservers) {
                ads.appendArray(items);
            }

            await batch.write();
            resolve(undefined);
        });
        return this.lock;
    }

    public async slice(startIndex: number, endIndex: number): Promise<T[]> {
        await this.lock;
        const len = await this.length();
        if (startIndex > len || startIndex < 0 || endIndex > len || endIndex < 0) {
            throw new Error('cannot write outside of bounds of array');
        }
        const items = [];
        for (let i = startIndex; i < endIndex; i++) {
            items.push(await this.db.get(i));
        }
        return items;
    }

    public async pop(): Promise<T> {
        await this.lock;
        this.lock = new Promise(async (resolve) => {
            const len = await this.length();
            const batch = this.db.batch();

            const v = await this.db.get(len - 1);
            //@ts-ignore
            batch.put(META_KEY, len - 1, {
                valueEncoding: 'json',
            });
            batch.del(len - 1);
            for (const ads of this.totalObservers) {
                ads.pop();
            }
            await batch.write();
            resolve(v);
        });
        return this.lock;
    }

    async clear(): Promise<void> {
        await this.lock;
        await this.db.clear();
        for (const ads of this.totalObservers) {
            ads.clear();
        }
        await this.db.put(META_KEY, 0, { valueEncoding: 'json' });
    }

    async toArray(): Promise<T[]> {
        await this.lock;
        const items = [];
        const len = await this.length();
        for (let i = 0; i < len; i++) {
            items.push(await this.db.get(i));
        }

        return items;
    }
    async forEach(cb: (item: T, index: number) => void): Promise<void> {
        await this.lock;
        const iterator = new AurumDBIterator<T>(this.db.iterator({}));
        let i = 0;
        while (await iterator.next()) {
            cb(iterator.current.value, i++);
        }
    }
}
