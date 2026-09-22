import { CancellationToken } from '@aurumjs/streams';
import { RemoteMessage, RemoteProtocol } from '@aurumjs/remote/protocol';
import type ws from 'ws';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client, ClientTransportConfig } from '../src/client.js';

class TestConnection {
    public readyState = 1;
    public bufferedAmount = 0;
    public readonly sent: RemoteMessage[] = [];
    public readonly closes: Array<{ code?: number; reason?: string }> = [];
    public callbackError?: Error;
    public thrownValue?: unknown;

    public send(data: string, callback: (error?: Error) => void): void {
        if (this.thrownValue !== undefined) throw this.thrownValue;
        this.sent.push(JSON.parse(data) as RemoteMessage);
        callback(this.callbackError);
    }

    public close(code?: number, reason?: string): void {
        this.closes.push({ code, reason });
        this.readyState = 3;
    }
}

function createClient(overrides: Partial<ClientTransportConfig> = {}): {
    client: Client<void>;
    connection: TestConnection;
    errors: Error[];
} {
    const connection = new TestConnection();
    const errors: Error[] = [];
    const client = new Client<void>(connection as unknown as ws, {
        batchDelayMs: 5,
        maxBufferedAmount: 100,
        maxQueueBytes: 10_000,
        onError: (error) => errors.push(error),
        ...overrides
    });
    return { client, connection, errors };
}

afterEach(() => vi.useRealTimers());

describe('server Client transport', () => {
    it('batches multiple updates but flushes queued data before control messages', async () => {
        vi.useFakeTimers();
        const { client, connection } = createClient();
        client.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: 'value', value: 1 });
        client.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: 'value', value: 2 });
        expect(connection.sent).toEqual([]);

        await vi.advanceTimersByTimeAsync(5);
        expect(connection.sent).toHaveLength(1);
        expect(connection.sent[0]).toMatchObject({ type: RemoteProtocol.BATCH });
        expect(connection.sent[0].messages?.map((message) => message.value)).toEqual([1, 2]);

        client.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: 'value', value: 3 });
        client.sendMessage(RemoteProtocol.HEARTBEAT);
        expect(connection.sent.slice(-2).map((message) => message.type)).toEqual([
            RemoteProtocol.UPDATE_DATASOURCE,
            RemoteProtocol.HEARTBEAT
        ]);
    });

    it('retries a flush after socket backpressure clears', async () => {
        vi.useFakeTimers();
        const { client, connection } = createClient({ batchDelayMs: 0 });
        connection.bufferedAmount = 101;
        client.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: 'value', value: 1 });
        await vi.advanceTimersByTimeAsync(0);
        expect(connection.sent).toEqual([]);

        connection.bufferedAmount = 0;
        await vi.advanceTimersByTimeAsync(1);
        expect(connection.sent).toHaveLength(1);
        expect(connection.sent[0]).toMatchObject({ type: RemoteProtocol.UPDATE_DATASOURCE, value: 1 });
    });

    it('closes a client whose outbound queue exceeds its byte budget', () => {
        vi.useFakeTimers();
        const { client, connection, errors } = createClient({ maxQueueBytes: 1 });
        client.sendMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: 'value', value: 'too large' });

        expect(errors[0].message).toContain('outbound queue exceeded 1 bytes');
        expect(connection.closes).toEqual([{ code: 1013, reason: 'outbound queue limit exceeded' }]);
        expect(connection.sent).toEqual([]);
    });

    it('reports callback and thrown send errors without throwing to callers', () => {
        const { client, connection, errors } = createClient();
        connection.callbackError = new Error('callback failure');
        client.sendMessage(RemoteProtocol.HEARTBEAT);
        connection.callbackError = undefined;
        connection.thrownValue = 'thrown failure';
        expect(() => client.sendMessage(RemoteProtocol.HEARTBEAT)).not.toThrow();

        expect(errors.map((error) => error.message)).toEqual(['callback failure', 'thrown failure']);
    });

    it('counts and cancels every subscription and RPC exactly once on disposal', () => {
        const { client, connection } = createClient();
        const cancelled: string[] = [];
        const subscriptionMaps = [
            client.mapdsSubscriptions,
            client.dsSubscriptions,
            client.adsSubscriptions,
            client.ddsSubscriptions,
            client.odsSubscriptions,
            client.setdsSubscriptions
        ];
        subscriptionMaps.forEach((subscriptions, index) => {
            const token = new CancellationToken();
            token.addCancellable(() => cancelled.push(`subscription-${index}`));
            subscriptions.set(String(index), token);
        });
        const rpcToken = new CancellationToken();
        rpcToken.addCancellable(() => cancelled.push('rpc'));
        client.rpcTokens.set('rpc', rpcToken);
        client.connectionToken.addCancellable(() => cancelled.push('connection'));

        expect(client.subscriptionCount).toBe(6);
        client.dispose(false);
        client.dispose(true);
        expect(cancelled).toEqual([
            'subscription-0',
            'subscription-1',
            'subscription-2',
            'subscription-3',
            'subscription-4',
            'subscription-5',
            'rpc',
            'connection'
        ]);
        expect(client.subscriptionCount).toBe(0);
        expect(connection.closes).toEqual([]);

        const closable = createClient();
        closable.client.dispose();
        expect(closable.connection.closes).toEqual([{ code: 1000, reason: 'session terminated' }]);
        closable.client.sendMessage(RemoteProtocol.HEARTBEAT);
        expect(closable.connection.sent).toEqual([]);
    });
});
