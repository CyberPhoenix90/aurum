# @aurum/remote

Versioned WebSocket transport for Aurum data sources and RPC. Use `RemoteClient` for explicit connection ownership, cancellation, reconnect behavior, and connection/RPC timeouts. The wire contract and runtime decoder are also available from `@aurum/remote/protocol`.

Heartbeats tolerate browser timer suspension, and `visibilitychange`/`online` wake-ups trigger an immediate probe. Subscriptions are acknowledged by the server. Array subscriptions carry monotonic revisions and automatically request an authoritative snapshot if a delta is missed.

```ts
import { DataSource, CancellationToken } from '@aurum/streams';
import { RemoteClient } from '@aurum/remote';

const client = await RemoteClient.connect({ url: 'wss://example.test/aurum' });
const cancellation = new CancellationToken();
const status = new DataSource<string>();
client.syncDataSource(status, 'status', { cancellationToken: cancellation });
client.subscriptionState.subscribe(({ id, state }) => console.log(id, state), cancellation);

const result = await client.call<{ id: string }, { name: string }>('load', { id: '42' }, {
    token: 'credential',
    cancellationToken: cancellation,
    timeoutMs: 5_000
});

cancellation.cancel();
client.close();
```

Remote transport symbols live here rather than in `@aurum/streams`, which keeps the stream package independent of networking. The `createRemoteDataSource`, `createRemoteDuplexDataSource`, `createRemoteArrayDataSource`, `createRemoteMapDataSource`, `createRemoteObjectDataSource`, and `createRemoteSetDataSource` helpers replace the former static remote factories.
