# Aurum DevTools extension

A Chromium DevTools extension for inspecting Aurum's runtime data-flow graph. It works with both debug and production builds: debug builds include names, annotations, bounded value previews, edge labels, and creation stacks, while privacy-oriented production builds expose topology, counters, and events without names, labels, or values.

## Build and install

From the repository root:

```sh
npm run devtools:build
```

Alternatively, build only the extension:

```sh
npm run build --workspace @aurum/devtools-extension
```

Then open `chrome://extensions` in Chrome or Chromium, enable **Developer mode**, choose **Load unpacked**, and select `packages/aurum-devtools-extension/dist`. Open DevTools on an Aurum application and select the **Aurum** panel.

The extension requests no host permissions. It evaluates its read-only bridge through the inspected-page API that Chromium exposes specifically to DevTools extensions.

## What the panel shows

- A directed graph of sources, transformations, component rendering, and their relationships.
- A node table searchable by name, kind, or id, with versions and subscription totals.
- Per-channel subscription counts and navigable upstream/downstream relationships.
- A live event timeline for node, edge, subscription, and configuration changes.
- Debug-only names, value previews, annotations, edge metadata, creation stacks, and explicit inspection results.
- Connection, runtime mode, protocol compatibility, capabilities, dropped-event, and weak-reference status.

Live state is checked every 500 ms while the panel is visible. Native runtime revisions avoid snapshot creation, serialization, and DOM rebuilding when nothing changed. Each page-side client queue is capped at 2,000 entries and approximately 1.5 MiB, and abandoned clients expire after five seconds. Hiding, pausing, or closing the panel unsubscribes it immediately.

Graph rendering is capped at 250 visible nodes. The node table renders pages of 200 rows, while search and kind filters can narrow larger applications. Multiple DevTools windows share one inspected-page subscription but retain independent event queues.

## Runtime protocol

The extension discovers the registry at:

```ts
globalThis[Symbol.for('@aurum/devtools')]
```

It also understands `globalThis.__AURUM_DEVTOOLS__` as a compatibility fallback. Protocol version 1 provides:

```ts
interface AurumDevtoolsRegistry {
    readonly runtimeId: string;
    readonly revision: number;
    readonly protocolVersion: 1;
    readonly mode: 'debug' | 'production';
    readonly capabilities: readonly string[];
    getSnapshot(options?: { includeValues?: boolean }): AurumDevtoolsSnapshot;
    subscribe(listener: (event: AurumDevtoolsEvent) => void): () => void;
    inspect(id: string): AurumDevtoolsNodeSnapshot | undefined;
}
```

The inspected-page bridge serializes defensively, reconnects when the registry instance changes, and is recreated automatically after navigation. Stable runtime identity prevents event-sequence collisions across replacement runtimes. Unsupported protocol versions show a warning while the panel continues rendering fields it can safely understand.

If a foreign or older v1 implementation does not expose `runtimeId` or `revision`, the extension supplies a client-stable identity and continues taking full snapshots. If a page prevents bridge storage on its global object, inspection remains available through leak-free snapshot polling without a live subscription.

## Development

```sh
npm test --workspace @aurum/devtools-extension
npm run build --workspace @aurum/devtools-extension
```

After rebuilding, use the reload button for the unpacked extension on `chrome://extensions`, then reopen the inspected page's DevTools window.
