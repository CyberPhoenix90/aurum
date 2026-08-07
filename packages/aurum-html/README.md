# @aurum/html

HTML nodes, DOM rendering, reactive styling, and HTML JSX types for Aurum. Import this package when a JSX module uses HTML or SVG intrinsic tags.

## Install

```sh
npm install @aurum/html
```

Configure TypeScript to compile JSX through Aurum:

```json
{
    "compilerOptions": {
        "jsx": "react",
        "jsxFactory": "Aurum.factory",
        "jsxFragmentFactory": "Aurum.fragment"
    }
}
```

Then import `Aurum` from the HTML package in files that use intrinsic elements:

```tsx
import { Aurum, DataSource } from '@aurum/html';

const message = new DataSource('Hello Aurum');
Aurum.attach(<div>{message}</div>, document.body);
```

Components that do not use HTML or SVG tags can depend on `@aurum/rendering`; reactive state without rendering can depend on `@aurum/streams` directly.

With `@aurum/vite-plugin` in debug mode, the browser developer tools can trace
component instances and reactive HTML content, class, style, and attribute
bindings back to their source graph. These richer DOM relationships are not
created in production mode; source topology and subscription information remain
available there through the lean runtime protocol.

`aurumToRenderTree` creates the host-neutral `RenderTree` while applying HTML class and style normalization. The former `aurumToVDOM`, `VDOM`, and `VDOMNode` exports remain as deprecated compatibility aliases.

## HTML compatibility and portals

Standard HTML tags are available as JSX intrinsics, including `section` and `datalist`. Tags without a specialized Aurum implementation use the generic intrinsic factory automatically; `createGenericIntrinsicFactory(tagName)` exposes the same behavior for components and custom elements. Use the HTML `class` prop—`className` is intentionally not an alias. Standard DOM-style aliases such as `htmlFor`, `readOnly`, `autoFocus`, `autoComplete`, `srcSet`, and `spellCheck` are supported.

`Portal` mounts its children into an element, selector, or reactive target while keeping their lifecycle tied to the owner. `RouterLink` and `RouterNavLink` provide History API/hash navigation and reactive active-link state for `AurumRouter`.

```tsx
const overlayTarget = new DataSource<HTMLElement | null>(document.body);

<Portal target={overlayTarget}><dialog open={true}>Tools</dialog></Portal>
<RouterNavLink to="/projects" activeClass="selected">Projects</RouterNavLink>
```

## Batched rendering

`batchRender` keeps Aurum streams fully synchronous while delaying DOM commits until the synchronous callback finishes. Repeated updates to the same rendered child, collection, attribute, class, style, or form-control property are coalesced to its final value. Nested batches flush once at the end of the outer batch, and the final DOM state is still flushed if the callback throws.

```tsx
Aurum.batchRender(() => {
    selectedTool.update('brush');
    selectedTool.update('eraser');
    selectedTool.update('fill');
});
```

Callbacks must be synchronous. Use batching for update bursts that touch the same render bindings; batching independent bindings still performs every DOM write and adds queueing overhead.

## Rendering benchmarks

The browser benchmark suite covers initial rendering, primitive collections, collections of components, every public `ArrayDataSource` mutation method, and reactive child updates. Render-batching benchmarks compare the unbatched hot path, repeated writes to one binding, component replacement bursts, and updates to independent bindings. Merge benchmarks separately measure identical snapshots, retained-item rotations and reversals, interleaved subsequence filtering and restoration, 10% and 100% churn, collection growth, truncation to empty, and duplicate-heavy primitive and repeated-component-reference collections. A developer-tools matrix measures scalar updates, rendered collection merges, and component mounting in lean production (with the panel closed and open) and rich debug modes (with stack capture off and on), plus topology polling over 1,000 sources.

```sh
npm run benchmark --workspace @aurum/html
```

Save a local baseline before a rendering change and compare afterward:

```sh
npm run benchmark:save --workspace @aurum/html
npm run benchmark:compare --workspace @aurum/html
```

Benchmarks run in headless Chromium. The baseline file is intentionally local so results are compared on the same machine and browser installation.

### ArrayDataSource DOM fast paths

`ArrayAurumElement` updates exact DOM ranges for replacement, prepend, left/middle removal, middle insertion, clear, prefix-only merge growth or truncation, and interleaved ordered-subsequence shrink/growth. Subsequence merges remove only rejected runs or insert only missing gaps, reconstruct the entry array in one pass, and never move retained DOM nodes. Other merge and reorder shapes continue through the identity-aware fallback. Large contiguous removals use a DOM range; small interleaved runs use direct removal because constructing thousands of ranges is slower.

The following before/after ratios were measured in headless Chromium with 1,000 rendered entries. Each benchmark performs an operation and restores the original state:

| Mutation | Primitive entries | Component entries |
| --- | ---: | ---: |
| Replace one middle entry (`set`) | 24.3× | 1.4× |
| Prepend then shift one entry | 177.9× | 17.5× |
| Remove and restore 10 left entries | 91.3× | 3.1× |
| Insert and remove 10 middle entries | 3.0× | 1.5× |
| Remove and restore 10 middle entries | 2.7× | 1.6× |
| Remove and restore one middle entry | 2.7× | 2.5× |
| Remove and restore matching entries (`removeWhere`) | 3.8× | 2.0× |

Absolute results vary by machine; use the baseline commands above when changing these paths.

Primitive collection entries now create text nodes without allocating lifecycle render sessions that they cannot use. This improved mount/dispose throughput by 1.7× for 100 primitive entries and 1.37× for 1,000 entries. A one-position merge rotation of 1,000 primitive entries uses one DOM move instead of general reconciliation and measured 14.6× faster.

The styled TODO comparison's filter-and-restore case improved from about 38 ms to 32 ms at 2,000 rows and from about 296 ms to 180 ms at 10,000 rows. The larger case is a 1.64× Aurum improvement and narrows React's advantage from roughly 2.0× to 1.34×. At 2,000 rows the implementations are within benchmark variance, with Aurum slightly ahead in the focused run.

Reactive scalar attributes, classes, and styles subscribe directly to their source and deduplicate the last value locally instead of allocating an internal transformed stream per binding. Intrinsic props are processed in one pass through precomputed attribute and event maps, component APIs use prototype methods instead of per-instance closures, and static props no longer force cleanup-token allocation. Consecutive collection inserts use a `DocumentFragment`, contiguous removals use a native DOM range, and nested entry sessions are deterministically disposed with their owning render range.

All regular browser benchmarks compile with production module conditions and `__AURUM_DEVTOOLS_INSTRUMENTATION__` disabled. The developer-tools overhead matrix is intentionally separate because it needs instrumentation present:

```sh
npm run benchmark:devtools --workspace @aurum/html
```

### React TODO comparison

`bench/todo_app_comparison.bench.tsx` implements the same styled, interactive TODO application in React 19 and Aurum. Both expose the same user controls and DOM roles for adding, editing, toggling, deleting, filtering, and clearing tasks. A validation pass exercises those controls before timing begins. The React version uses the production `createRoot` API, `flushSync` measurement boundaries, memoized rows and callbacks, and immutable functional updates. The Aurum version uses granular row data sources, `ArrayDataSource` mutations, and render batching.

Every mutation benchmark restores its own state inside the timed operation so every sample performs real equivalent DOM work; no sample relies on a one-time setup hook or degrades into a no-op. Suites are isolated so only the currently measured implementation retains its fixture in the DOM. On this machine, the comparison measured:

| TODO workload | Faster implementation | Throughput difference |
| --- | --- | ---: |
| Mount and dispose 1,000 rows | Tie | 1.0× |
| Append and remove 1,000 rows | Aurum | 1.1× |
| Delete and restore 250 deterministic random rows | Aurum | 1.2× |
| Filter 2,000 rows and restore the full list | Tie | 1.2× |
| Clear and restore completed rows from 2,000 | Tie | 1.0× |
| Toggle 250 deterministic random rows twice | Aurum | 9.2× |
| Edit 250 deterministic random rows | Aurum | 12.0× |

Compared with the previous renderer and instrumented-production path on this machine, Aurum's 1,000-row mount/dispose time fell from 557 ms to 22 ms (25.7×), append/remove fell from 548 ms to 24 ms (23.2×), random delete/restore fell from 143 ms to 6.3 ms (22.8×), filtering fell from 779 ms to 32 ms (24.3×), and clear/restore fell from 408 ms to 15 ms (28.1×). This measures synchronous operation completion, not animation-frame consistency or input latency under a sustained stream. The retained-row toggle and edit cases are the closest workloads here to a streaming application, and those continue to favor Aurum. Run only this comparison with:

```sh
npm run benchmark --workspace @aurum/html -- todo_app_comparison
```

The module also contains a low-sample 10× stress tier. Structural operations are slow enough that it uses three measured samples after one warmup; its ratios are directional and have wider error margins:

| 10× TODO workload | React mean | Aurum mean | Faster implementation |
| --- | ---: | ---: | ---: |
| Append and remove 10,000 rows | 528 ms | 532 ms | Tie, 1.0× |
| Delete and restore 2,500 deterministic random rows | 59 ms | 64 ms | Tie, 1.1× |
| Filter 10,000 rows and restore the full list | 135 ms | 180 ms | React, 1.34× |
| Toggle 2,500 deterministic random rows twice | 48 ms | 13 ms | Aurum, 3.7× |
| Edit 2,500 deterministic random rows | 27 ms | 3.8 ms | Aurum, 6.9× |

At 10× scale, React retains a smaller structural advantage while Aurum keeps its fine-grained update advantage. Run only the stress tier with:

```sh
npm run benchmark --workspace @aurum/html -- todo_app_comparison -t "10× stress"
```
