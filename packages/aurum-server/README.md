# @aurum/server

Versioned WebSocket server for Aurum data-source synchronization and RPC. Browser and explicit transport ownership live in `@aurum/remote`.

```ts
import { AurumServer } from '@aurum/server';

const server = await AurumServer.start({ port: 8080 });
server.exposeFunction('status', () => ({ ready: true }), {
    authenticate: (token) => token === process.env.API_TOKEN
});

await server.close();
```

Incoming frames are byte-limited and runtime validated against protocol version 1. The server supports connection authentication, acknowledged subscriptions, revisioned array snapshots, per-client message/subscription/RPC limits, outbound queue limits, backpressure, batched updates, cancellable RPC handlers, and graceful shutdown.

Run `npm test -w @aurum/server` for real WebSocket integration tests and `npm run benchmark -w @aurum/server` for the local fan-out baseline.
