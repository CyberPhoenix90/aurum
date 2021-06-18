import { META_KEY } from './constants';

export class AurumDBIterator<T> {
    private iterator: any;
    public current: { key: string; value: T };

    constructor(iterator: any) {
        this.iterator = iterator;
    }

    public async *asGenerator(): AsyncGenerator<{ key: string; value: T }> {
        while (await this.next()) {
            yield this.current;
        }
    }

    public next(): Promise<{ key: string; value: T }> {
        return new Promise<{ key: string; value: T }>((resolve, reject) => {
            function cb(err: any, key: string, value: T) {
                if (err) {
                    this.end();
                    reject(err);
                } else {
                    if (!key) {
                        this.end();
                    }
                    if (!key) {
                        this.current = undefined;
                    } else {
                        if (key === META_KEY) {
                            return this.iterator.next(cb.bind(this));
                        } else {
                            this.current = { key, value };
                        }
                    }
                    resolve(this.current);
                }
            }
            this.iterator.next(cb.bind(this));
        });
    }

    public async end(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.current = undefined;
            this.iterator.end((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
