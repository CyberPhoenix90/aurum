# @aurum/compat

`@aurum/compat` is an optional migration runtime for React-shaped function
components. It provides automatic JSX, keyed reconciliation, common hooks,
contexts, refs, portals, and a `createRoot` API while rendering through Aurum.

New Aurum applications should normally use `@aurum/html` and reactive data
sources directly. This package is intended for incremental ports where keeping
component identity and familiar hook semantics materially reduces migration
risk.

```json
{
    "compilerOptions": {
        "jsx": "react-jsx",
        "jsxImportSource": "@aurum/compat"
    }
}
```

```tsx
import { createRoot, useState } from '@aurum/compat';

function Counter() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount((value) => value + 1)}>{count}</button>;
}

const root = createRoot(document.getElementById('app')!);
root.render(<Counter />);
```
