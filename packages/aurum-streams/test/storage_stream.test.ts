import { assert, beforeEach, describe, it } from 'vitest';
import { CancellationToken, StorageStream } from '../src/index.js';

class MemoryStorage implements Storage {
    private data = new Map<string, string>();

    public get length(): number {
        return this.data.size;
    }

    public clear(): void {
        this.data.clear();
    }

    public getItem(key: string): string | null {
        return this.data.get(key) ?? null;
    }

    public key(index: number): string | null {
        return Array.from(this.data.keys())[index] ?? null;
    }

    public removeItem(key: string): void {
        this.data.delete(key);
    }

    public setItem(key: string, value: string): void {
        this.data.set(key, String(value));
    }
}

describe('StorageStream', () => {
    let storage: MemoryStorage;
    let streams: StorageStream;

    beforeEach(() => {
        storage = new MemoryStorage();
        streams = new StorageStream(storage);
    });

    it('synchronizes string values in both directions and restores defaults on removal', () => {
        const source = streams.listenAsString('name', 'anonymous');
        assert.equal(source.value, 'anonymous');

        storage.setItem('name', 'Aurum');
        assert.equal(source.value, 'Aurum');
        source.write('Codex');
        assert.equal(storage.getItem('name'), 'Codex');
        source.write('anonymous');
        assert.isNull(storage.getItem('name'));

        storage.setItem('name', 'again');
        storage.removeItem('name');
        assert.equal(source.value, 'anonymous');
    });

    it('resets every observed key when storage is cleared', () => {
        storage.setItem('name', 'stored');
        storage.setItem('count', '5');
        const name = streams.listenAsString('name', 'default');
        const count = streams.listenAsNumber('count', 0);
        storage.clear();
        assert.equal(name.value, 'default');
        assert.equal(count.value, 0);
    });

    it('parses and serializes numbers with configurable radix', () => {
        storage.setItem('hex', 'ff');
        const source = streams.listenAsNumber('hex', 0, undefined, 16);
        assert.equal(source.value, 255);
        storage.setItem('hex', '10');
        assert.equal(source.value, 16);
        source.write(32);
        assert.equal(storage.getItem('hex'), '32');
        source.write(0);
        assert.isNull(storage.getItem('hex'));
    });

    it('parses and serializes dates while recognizing the default reference', () => {
        const fallback = new Date('2020-01-01T00:00:00.000Z');
        storage.setItem('date', '2021-02-03T04:05:06.000Z');
        const source = streams.listenAsDate('date', fallback);
        assert.equal(source.value.toISOString(), '2021-02-03T04:05:06.000Z');

        const replacement = new Date('2022-03-04T05:06:07.000Z');
        source.write(replacement);
        assert.equal(storage.getItem('date'), replacement.toJSON());
        source.write(fallback);
        assert.isNull(storage.getItem('date'));
        storage.removeItem('date');
        assert.strictEqual(source.value, fallback);
    });

    it('parses booleans and removes the configured default', () => {
        const source = streams.listenAsBoolean('enabled', false);
        storage.setItem('enabled', 'true');
        assert.isTrue(source.value);
        storage.setItem('enabled', 'anything-else');
        assert.isFalse(source.value);
        source.write(true);
        assert.equal(storage.getItem('enabled'), 'true');
        source.write(false);
        assert.isNull(storage.getItem('enabled'));
    });

    it('parses objects, serializes writes, and regenerates provider defaults', () => {
        let generated = 0;
        const source = streams.listenAsObject('settings', () => ({ revision: ++generated }));
        assert.deepEqual(source.value, { revision: 1 });
        storage.setItem('settings', JSON.stringify({ revision: 10 }));
        assert.deepEqual(source.value, { revision: 10 });

        source.write({ revision: 20 });
        assert.equal(storage.getItem('settings'), '{"revision":20}');
        source.write(undefined as any);
        assert.isNull(storage.getItem('settings'));
        storage.removeItem('settings');
        assert.deepEqual(source.value, { revision: 2 });
    });

    it('validates numeric and string enum values', () => {
        enum NumericMode {
            First,
            Second
        }
        enum StringMode {
            First = 'first',
            Second = 'second'
        }
        const numeric = streams.listenAsEnum('numeric', NumericMode, NumericMode.First);
        const textual = streams.listenAsEnum('textual', StringMode, StringMode.First);

        storage.setItem('numeric', '1');
        storage.setItem('textual', 'second');
        assert.equal(numeric.value, NumericMode.Second);
        assert.equal(textual.value, StringMode.Second);
        storage.setItem('numeric', '99');
        storage.setItem('textual', 'unknown');
        assert.equal(numeric.value, NumericMode.First);
        assert.equal(textual.value, StringMode.First);

        numeric.write(NumericMode.Second);
        textual.write(StringMode.Second);
        assert.equal(storage.getItem('numeric'), '1');
        assert.equal(storage.getItem('textual'), 'second');
        numeric.write(NumericMode.First);
        textual.write(StringMode.First);
        assert.isNull(storage.getItem('numeric'));
        assert.isNull(storage.getItem('textual'));
    });

    it('synchronizes array collections with serialized storage', () => {
        storage.setItem('items', '[1,2]');
        const source = streams.listenAsArray<number>('items');
        assert.deepEqual(source.toArray(), [1, 2]);

        storage.setItem('items', '[3,4]');
        assert.deepEqual(source.toArray(), [3, 4]);
        source.push(5);
        assert.equal(storage.getItem('items'), '[3,4,5]');
        storage.removeItem('items');
        assert.deepEqual(source.toArray(), []);
    });

    it('synchronizes set collections with unique serialized storage', () => {
        storage.setItem('items', '[1,1,2]');
        const source = streams.listenAsSet<number>('items');
        assert.deepEqual(source.toArray(), [1, 2]);

        storage.setItem('items', '[2,3]');
        assert.deepEqual(source.toArray(), [2, 3]);
        source.add(4);
        assert.equal(storage.getItem('items'), '[2,3,4]');
        storage.removeItem('items');
        assert.deepEqual(source.toArray(), []);
    });

    it('detaches both storage observation and upstream persistence on cancellation', () => {
        const token = new CancellationToken();
        const source = streams.listenAsString('key', 'default', token);
        storage.setItem('key', 'first');
        token.cancel();
        storage.setItem('key', 'ignored');
        source.write('not-persisted');

        assert.equal(source.value, 'not-persisted');
        assert.equal(storage.getItem('key'), 'ignored');
    });
});
