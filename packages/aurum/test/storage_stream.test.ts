import { expect, describe, beforeEach, it } from 'vitest';
import { StorageStream } from '../src/utilities/storage_stream.js';

describe('StorageStream', () => {
    let storageStream: StorageStream;
    let storage: Storage;

    beforeEach(() => {
        storage = {
            length: 0,
            data: {},
            key(index: number): string | null {
                return Object.keys(this.data)[index] ?? null;
            },
            setItem(key: string, value: string): void {
                this.data[key] = value;
            },
            getItem(key: string) {
                return this.data[key];
            },
            removeItem(key: string) {
                delete this.data[key];
            },
            clear() {
                this.data = {};
            }
        } as Storage;

        storageStream = new StorageStream(storage);
    });

    it('should listen to storage changes', () => {
        const key = 'test-key';
        const defaultValue = 'test-default-value';
        const newValue = 'test-new-value';

        const stream = storageStream.listenAsString(key, defaultValue);

        expect(stream.value).toEqual(defaultValue);

        storage.setItem(key, newValue);

        expect(stream.value).toEqual(newValue);
    });

    it('should remove storage item on stream update with default value', () => {
        const key = 'test-key';
        const defaultValue = 'test-default-value';

        const stream = storageStream.listenAsString(key, defaultValue);

        expect(stream.value).toEqual(defaultValue);
        expect(storage.getItem(key)).toBeUndefined();

        stream.updateUpstream('test-new-value');
        expect(storage.getItem(key)).toEqual('test-new-value');

        stream.updateUpstream(defaultValue);

        expect(storage.getItem(key)).toBeUndefined();
    });

    it('should remove storage item on stream update with undefined', () => {
        const key = 'test-key';
        const defaultValue = 'test-default-value';

        const stream = storageStream.listenAsString(key, defaultValue);

        expect(stream.value).toEqual(defaultValue);
        expect(storage.getItem(key)).toBeUndefined();

        stream.updateUpstream('test-new-value');
        expect(storage.getItem(key)).toEqual('test-new-value');

        stream.updateUpstream(undefined);

        expect(storage.getItem(key)).toBeUndefined();
    });

    it('should be able to listen to number values', () => {
        const testField = 'test-key';
        const defaultValue = 0;

        const stream = storageStream.listenAsNumber(testField, defaultValue);

        expect(stream.value).toEqual(defaultValue);

        storage.setItem(testField, '1');
        expect(stream.value).toEqual(1);

        storage.setItem(testField, '2');
        expect(stream.value).toEqual(2);
    });

    it('should be able to listen to number values with custom radix', () => {
        const testField = 'test-key';
        const defaultValue = 0;

        const stream = storageStream.listenAsNumber(testField, defaultValue, undefined, 16);

        expect(stream.value).toEqual(defaultValue);

        storage.setItem(testField, '1');
        expect(stream.value).toEqual(1);

        storage.setItem(testField, '2');
        expect(stream.value).toEqual(2);
    });

    it('should be able to listen to boolean values', () => {
        const testField = 'test-key';
        const defaultValue = false;

        const stream = storageStream.listenAsBoolean(testField, defaultValue);

        expect(stream.value).toEqual(defaultValue);

        storage.setItem(testField, 'true');
        expect(stream.value).toEqual(true);

        storage.setItem(testField, 'false');
        expect(stream.value).toEqual(false);
    });

    it('should be able to listen to object values with a default value', () => {
        const testField = 'test-key';
        const defaultValue = { foo: 'bar' };

        const stream = storageStream.listenAsObject(testField, defaultValue);

        expect(stream.value).toEqual(defaultValue);

        storage.setItem(testField, JSON.stringify({ baz: 'qux' }));
        //@ts-ignore
        expect(stream.value).toEqual({ baz: 'qux' });
    });

    it('should be able to listen to array values with a default value', () => {
        const testField = 'test-key';

        const stream = storageStream.listenAsArray(testField);

        storage.setItem(testField, JSON.stringify([4, 5, 6]));
        expect(stream.getData()).toEqual([4, 5, 6]);

        stream.push(7);
        expect(storage.getItem(testField)).toEqual('[4,5,6,7]');
    });
});
