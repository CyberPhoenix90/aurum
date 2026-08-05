import { CancellationToken, DataSource } from '@aurum/streams';
import { RemoteClient, WebSocketFactory } from '@aurum/remote';
import WebSocket from 'ws';
import { AurumServer } from '../src/server.js';

void main();

async function main(): Promise<void> {
    const clientCount = 50;
    const updateCount = 200;
    const server = await AurumServer.start({ port: 0, batchDelayMs: 0, onError: () => undefined });
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Expected TCP server address');
    }
    const url = `ws://127.0.0.1:${address.port}`;
    const source = new DataSource(0);
    server.exposeDataSource('benchmark', source);

    const clients = await Promise.all(
        Array.from({ length: clientCount }, () =>
            RemoteClient.connect({
                url,
                webSocketFactory: WebSocket as unknown as WebSocketFactory,
                heartbeatIntervalMs: 60_000,
                heartbeatTimeoutMs: 120_000
            })
        )
    );
    const tokens = clients.map(() => new CancellationToken());
    const mirrors = clients.map((client, index) => {
        const mirror = new DataSource<number>();
        client.syncDataSource(mirror, 'benchmark', { cancellationToken: tokens[index] });
        return mirror;
    });
    await until(() => mirrors.every((mirror) => mirror.value === 0));

    const started = performance.now();
    for (let value = 1; value <= updateCount; value++) {
        source.update(value);
    }
    await until(() => mirrors.every((mirror) => mirror.value === updateCount));
    const elapsed = performance.now() - started;
    const deliveredUpdates = clientCount * updateCount;
    console.log(
        `${clientCount} clients × ${updateCount} updates: ${elapsed.toFixed(2)} ms, ${Math.round(deliveredUpdates / (elapsed / 1000)).toLocaleString()} delivered updates/s`
    );

    tokens.forEach((token) => token.cancel());
    clients.forEach((client) => client.close());
    await server.close();
}

async function until(predicate: () => boolean, timeoutMs = 10_000): Promise<void> {
    const startedAt = Date.now();
    while (!predicate()) {
        if (Date.now() - startedAt > timeoutMs) {
            throw new Error('Benchmark timed out');
        }
        await new Promise((resolve) => setTimeout(resolve, 1));
    }
}
