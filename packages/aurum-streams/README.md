# @aurum/streams

Reactive data sources, collections, channels, operators, and cancellation primitives for Aurum. This package has no JSX or HTML API.

## Collection identity

Every occurrence in an `ArrayDataSource` receives an opaque source-owned identity. Insertions, removals, replacements, swaps, merges, and derived views propagate that identity automatically, including duplicate primitive values. Renderers can therefore retain component and node state without requiring application keys. Identity metadata is non-enumerable and is not included when collection changes are serialized.

## Operators

`DataSource.transform` composes synchronous and asynchronous operators without a fixed chain-length limit. Operator definitions are reusable: each attached pipeline receives isolated state and shares the transform's `CancellationToken` for timers, queues, subscriptions, and in-flight result suppression.

```ts
import { CancellationToken, DataSource, dsDistinct, dsMapAsync, dsScan } from '@aurum/streams';

const lifetime = new CancellationToken();
const input = new DataSource<number>();
const output = input.transform(
    dsDistinct(),
    dsMapAsync(async (value) => loadValue(value), { concurrency: 'latest' }),
    dsScan((results, value) => [...results, value], []),
    lifetime
);
```

Async maps and filters accept `concurrency: "parallel" | "ordered" | "latest"`. `parallel` retains the merge-style default, `ordered` serializes work in input order, and `latest` suppresses stale results. Existing `dsUnique`, `dsReduce`, and `dsCutOff` names remain supported alongside the more familiar `dsDistinct`, `dsScan`, and `dsTake` aliases.

`awaitValue` resolves immediately for an existing matching value or waits for a matching update. Its optional predicate defaults to accepting non-null, non-undefined values, supports type-guard narrowing, and accepts a cancellation token.

```ts
const document = new DataSource<Document | undefined>();
const loadedDocument = await document.awaitValue(cancellation);
const selected = await selection.awaitValue((value) => value.length > 0, cancellation);
```

## Observable trees

`TreeDataSource` models an ordered, identity-based tree. Give it the property that contains each node's children; native arrays are normalized to `ArrayDataSource`s, including arrays in subtrees inserted later.

```ts
import { CancellationToken, TreeDataSource } from '@aurum/streams';

const tree = new TreeDataSource('children', [{ id: 'root', children: [] }]);
const cancellation = new CancellationToken();

tree.listen((change) => console.log(change.operation, change.changedNode), cancellation);
tree.getChildren(tree.roots.get(0)).push({ id: 'child', children: [] });
```

Root and child additions, removals, replacements, swaps, merges, and whole-subtree membership changes are observable. `createArrayDataSourceOfNodes` provides a reactive pre-order flattening, while `map` preserves the tree structure and the identity of mapped nodes that remain in the source tree. Nodes must be acyclic and cannot be shared between positions.

## Observable records

`ObjectDataSource` is shallow by design. Writes through `set`, `delete`, `assign`, or `merge` produce discriminated `ObjectChange` events with `operation: "set" | "delete"`; callers can observe the whole record or an individual key. `pick`, `pickDuplex`, `pickArray`, and `pickObject` create synchronized field lenses whose lifetime can be controlled with a `CancellationToken`.

The source owns a shallow copy of its initial record. `toObject()` and `toDataSource()` produce independent outer snapshots, while nested values remain opaque unless accessed through an object or array lens.

## Developer tools protocol

All stream primitives register with the Aurum inspector. In a browser page the registry is discoverable as both `globalThis.__AURUM_DEVTOOLS__` and `globalThis[Symbol.for('@aurum/devtools')]`; in server and non-browser runtimes it remains module-local and does not modify the global object. Every registry owns a stable `runtimeId`, and its monotonic `revision` lets clients skip unchanged snapshots.

Production mode exposes only weak node identities, kinds, graph topology, versions, and subscription counts. Per-key subscription channels are combined as `keys`, while unknown channel names are combined as `other`. It never retains, walks, or exposes values, node names, relationship labels, annotations, or creation stacks, even while an inspector is connected. Debug mode adds those diagnostics, bounded event history, and safe serializable previews limited by depth, entries per container, and a shared node budget. The page-global registry is a frozen public facade; internal node records and weak targets are never attached to the page global.

When `__AURUM_DEVTOOLS_MODE__` is compiled as `"production"`, that choice is a permanent ceiling: runtime configuration cannot enable debug mode or stack capture, and event history remains disabled. The Vite integration supplies these compile-time definitions:

```ts
define: {
    __AURUM_DEVTOOLS_MODE__: JSON.stringify('debug'),
    __AURUM_DEVTOOLS_CAPTURE_STACKS__: JSON.stringify(true),
    __AURUM_DEVTOOLS_HISTORY_LIMIT__: JSON.stringify(200),
    __AURUM_DEVTOOLS_INSTRUMENTATION__: JSON.stringify(true)
}
```

Setting `__AURUM_DEVTOOLS_INSTRUMENTATION__` to `false` turns stream and renderer registration helpers into compile-time no-ops and avoids installing subscription-count observers. The registry remains API-compatible but contains no automatically instrumented Aurum nodes. This is intended for performance-critical production builds that do not need extension inspection.

Custom renderers can participate without depending on stream internals:

```ts
import {
    emitAurumDevtoolsUpdate,
    linkAurumDevtoolsNodes,
    registerAurumDevtoolsNode
} from '@aurum/streams';

const id = registerAurumDevtoolsNode(binding, {
    kind: 'render-binding',
    name: 'status text',
    getValue: (target) => target.currentValue
}, lifetime);

linkAurumDevtoolsNodes(statusSource, binding, { kind: 'render', label: 'text' }, lifetime);
emitAurumDevtoolsUpdate(id, { kind: 'rendered', value: binding.currentValue });
```

Registration and graph links accept an optional cancellation token for deterministic cleanup. Repeated registration of the same target is retain-counted, so cancelling one owner cannot remove another owner's node. Where `WeakRef` is available, the registry never strongly retains targets; older runtimes use a bounded fallback registry. Raw source values are never stored in event history.
