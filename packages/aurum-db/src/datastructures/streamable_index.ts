import { ReadStream, WriteStream } from 'fs';
import * as streamify from 'level-stream-access';
import { LevelUp } from 'levelup';

interface StreamableDb {
    createWriteStream(key: string, options?: { append: boolean }): WriteStream;
    createReadStream(key: string): ReadStream;
    delete: (key: string, callback) => void;
    prepend: (key: string, value: Buffer, callback: (err: Error) => void) => void;
    setMeta: (key: string, data: any, callback: (err: Error) => void) => void;
    getMeta: (key: string, callback: (err: Error, value: any) => void) => void;
}

export class AurumDBStreamableIndex<T> {
    private streamableDb: StreamableDb;
    protected db: LevelUp;

    constructor(db: LevelUp) {
        this.db = db;
        this.streamableDb = streamify(db);
    }

    /**
     * Deletes an entire recording including meta data
     */
    public delete(key: string): Promise<void> {
        this.db.del(key);
        return new Promise((resolve, reject) => {
            this.streamableDb.delete(key, (err) => (err ? reject(err) : resolve()));
        });
    }

    public has(key: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.db.get(key, (err) => resolve(!err));
        });
    }

    public getRecordState(key: string): Promise<{ state: 'recording' | 'complete'; lastChange: number }> {
        return new Promise((resolve, reject) => {
            this.db.get(
                key,
                {
                    valueEncoding: 'json',
                },
                (err, value) => (err ? reject(err) : resolve(value))
            );
        });
    }

    public append(key: string): WriteStream {
        return this.streamableDb.createWriteStream(key);
    }

    public async write(key: string): Promise<WriteStream> {
        await this.db.put(
            key,
            { state: 'recording', lastChange: Date.now() },
            {
                valueEncoding: 'json',
            }
        );
        const s = this.streamableDb.createWriteStream(key, { append: false });
        s.on('close', () => {
            this.db.put(
                key,
                { state: 'complete', lastChange: Date.now() },
                {
                    valueEncoding: 'json',
                }
            );
        });
        return s;
    }

    public read(key: string): ReadStream {
        return this.streamableDb.createReadStream(key);
    }

    /**
     * Prepends a binary chunk at the start of an existing record
     */
    public prepend(key: string, data: Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            this.streamableDb.prepend(key, data, (err) => (err ? reject(err) : resolve()));
        });
    }

    /**
     * Allows attaching json encoded data to the same key as a record
     */
    public setMetadata(key: string, value: T): Promise<void> {
        return new Promise((resolve, reject) => {
            this.streamableDb.setMeta(key, value, (err) => (err ? reject(err) : resolve()));
        });
    }

    /**
     * Allows attaching json encoded data to the same key as a record
     */
    public getMetadata(key: string): Promise<T> {
        return new Promise((resolve, reject) => {
            this.streamableDb.getMeta(key, (err, value) => (err ? reject(err) : resolve(value)));
        });
    }
}
