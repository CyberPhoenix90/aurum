# @aurum/rendering

The component model and renderer-facing primitives for Aurum. Its JSX factory accepts components but deliberately exposes no implicit intrinsic tags.

`Renderable` recursively describes primitives, nested arrays, promises, scalar sources, collection sources, and element models. Component prerender results are generic, allowing renderer extensions to declare their native intermediate model without falling back to `any`. Browser node types and the DOM marker runtime live in `@aurum/html`, not this package.

## Custom rendering hosts

`renderToTree` evaluates Aurum components into a persistent, host-neutral `RenderTree`. Reactive values update that tree in place, collection entries retain identity across incremental mutations, and `onPatch` reports inserts, removals, moves, text changes, and property changes.

```ts
import { renderToTree } from '@aurum/rendering';

const tree = renderToTree(application, { cancellationToken: lifetime });
tree.onPatch.subscribe((patch) => terminalRenderer.apply(patch), lifetime);
```

Extensions that already expose host mutation primitives can implement `RendererHost<Node>` and use `renderToHost`. The core renderer owns component evaluation, reactive subscriptions, promises, and subtree disposal; the host only creates and mutates its native nodes.

Properties remain host-neutral values. Renderer packages can provide `resolveProperty` to normalize concepts such as HTML classes and styles without introducing those semantics into the component renderer.

## Component handles

For imperative APIs that need to return values, a component can explicitly expose a typed public contract. Handles are populated after attachment and cleared automatically on detach; ordinary state and one-way commands should continue to use streams.

```tsx
interface EditorHandle {
    focus(): void;
    getSelection(): string;
}

const editor = createComponentHandle<EditorHandle>();

function Editor(props: { handle: ComponentHandle<EditorHandle> }, children, api: AurumComponentAPI) {
    let input!: HTMLTextAreaElement;
    api.expose(props.handle, {
        focus: () => input.focus(),
        getSelection: () => input.value
    });
    return <textarea onAttach={(node) => input = node} />;
}

const editorAPI = await editor.awaitValue(cancellationToken);
editorAPI.focus();
```

## Developer-tool graph

In an Aurum debug build, component evaluations are registered as inspectable
instances. Parent/child component edges and links from reactive sources to
render ranges are removed with the same cancellation scopes that own the
rendered content. Production builds omit these renderer-level records while
retaining the lightweight source graph supplied by `@aurum/streams`.

Custom hosts built with `renderToTree` or `renderToHost` receive this behavior
automatically. A renderer with its own mutation loop can call
`registerAurumRenderBinding` to associate a source with its native output.
