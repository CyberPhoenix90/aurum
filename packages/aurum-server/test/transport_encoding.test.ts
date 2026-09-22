import { RemoteMessage, RemoteProtocol, createRemoteMessage, decodeRemoteMessages } from '@aurumjs/remote/protocol';
import type ws from 'ws';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '../src/client.js';

function createClient(maxQueueBytes = 10000) {
    const frames: string[] = [];
    const errors: Error[] = [];
    const connection = {
        readyState: 1,
        bufferedAmount: 0,
        send: (frame: string, callback: (error?: Error) => void) => { frames.push(frame); callback(); },
        close: vi.fn()
    };
    const client = new Client(connection as unknown as ws, {
        batchDelayMs: 5, maxBufferedAmount: 100, maxQueueBytes, onError: (error) => errors.push(error)
    });
    return { client, connection, frames, errors };
}

afterEach(() => vi.useRealTimers());

describe('outbound encoding', () => {
    it.each([1, 2])('encodes each payload once with %i queued messages', (count) => {
        vi.useFakeTimers();
        const { client, frames } = createClient();
        const toJSON = vi.fn(() => ({ text: 'é 😀 " \\ \n', value: 1 }));
        for (let index = 0; index < count; index++) {
            client.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: String(index), value: { toJSON } });
        }
        expect(toJSON).toHaveBeenCalledTimes(count);
        client.flush();
        expect(toJSON).toHaveBeenCalledTimes(count);
        expect(frames).toHaveLength(1);
        const messages = decodeRemoteMessages(frames[0]);
        expect(messages).toHaveLength(count);
        expect(messages.map((message) => message.value)).toEqual(Array.from({ length: count }, () => ({ text: 'é 😀 " \\ \n', value: 1 })));
        expect((JSON.parse(frames[0]) as RemoteMessage).type).toBe(count === 1 ? RemoteProtocol.UPDATE_DATASOURCE : RemoteProtocol.BATCH);
        client.dispose(false);
    });

    it('captures successive mutable values when queued, including under backpressure', async () => {
        vi.useFakeTimers();
        const { client, connection, frames } = createClient();
        const value = { nested: { count: 1 } };
        connection.bufferedAmount = 101;
        client.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: 'value', value });
        value.nested.count = 2;
        client.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: 'value', value });
        value.nested.count = 3;
        await vi.advanceTimersByTimeAsync(5);
        expect(frames).toEqual([]);
        connection.bufferedAmount = 0;
        await vi.advanceTimersByTimeAsync(5);
        expect(decodeRemoteMessages(frames[0]).map((message) => message.value)).toEqual([{ nested: { count: 1 } }, { nested: { count: 2 } }]);
        client.dispose(false);
    });

    it('enforces the UTF-8 byte budget on the stored encoding', () => {
        vi.useFakeTimers();
        const payload = { id: 'value', value: '😀é' };
        const bytes = Buffer.byteLength(JSON.stringify(createRemoteMessage(RemoteProtocol.UPDATE_DATASOURCE, payload)));
        const exact = createClient(bytes);
        exact.client.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, payload);
        exact.client.flush();
        expect(exact.frames).toHaveLength(1);
        expect(exact.connection.close).not.toHaveBeenCalled();
        exact.client.dispose(false);
        const limited = createClient(bytes - 1);
        limited.client.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, payload);
        expect(limited.connection.close).toHaveBeenCalledWith(1013, 'outbound queue limit exceeded');
        expect(limited.frames).toEqual([]);
        limited.client.dispose(false);
    });

    it('reports encoding errors without poisoning an existing queue', () => {
        vi.useFakeTimers();
        const { client, frames, errors } = createClient();
        const cyclic: { self?: unknown } = {};
        cyclic.self = cyclic;
        client.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: 'value', value: 1 });
        expect(() => client.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: 'value', value: cyclic })).not.toThrow();
        client.flush();
        expect(errors).toHaveLength(1);
        expect(decodeRemoteMessages(frames[0])[0].value).toBe(1);
        client.dispose(false);
    });
});
