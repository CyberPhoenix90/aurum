# @aurum/vite-plugin

Vite build policy for Aurum developer tooling. Development builds retain rich
data-flow metadata such as source allocation stacks. Production
builds keep the lightweight graph instrumentation required by the browser
extension while omitting expensive metadata by default.

## Setup

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { aurumDevtools } from '@aurum/vite-plugin';

export default defineConfig({
    plugins: [aurumDevtools()]
});
```

The default `auto` policy resolves as follows:

| Vite invocation | Aurum mode | Stack capture | Instrumentation |
| --- | --- | --- | --- |
| Development server | `debug` | Enabled | Enabled |
| Production build | `production` | Disabled | Enabled |
| Build with another mode | `debug` | Enabled | Enabled |

Instrumentation is not disabled in production. The extension can still show
the live source and subscription graph, but names, creation locations, and
other debug-only metadata are omitted from Aurum's production protocol.
Set `instrumentation: false` when the application should compile graph
registration out entirely. The extension cannot inspect that build, but stream
construction and subscription changes avoid all registry work.

A production build locks that policy into the runtime. Calls to runtime
configuration cannot promote it back to debug mode or re-enable stack and
event-history retention; use an explicit `mode: 'debug'` diagnostic build when
those details are needed.

## Explicit policy

The policy can be overridden for diagnostic builds or particularly sensitive
development environments:

```ts
aurumDevtools({
    mode: 'production',
    captureStacks: false,
    instrumentation: false
});
```

`mode` accepts `auto`, `debug`, or `production`. `captureStacks` defaults to
true in debug mode and can be disabled there. Production mode always forces it
off so a lean build cannot accidentally retain call sites.
`instrumentation` defaults to `true` and is independent of the metadata mode.

## Build constants

The plugin defines these constants for Aurum's runtime packages:

- `__AURUM_DEVTOOLS_MODE__`: `"debug"` or `"production"`
- `__AURUM_DEVTOOLS_CAPTURE_STACKS__`: `true` or `false`
- `__AURUM_DEVTOOLS_INSTRUMENTATION__`: `true` or `false`

Aurum guards reads with `typeof`, so running its unbundled output in Node or
using another bundler does not depend on globals provided by this plugin.

Applications can inspect the resolved policy explicitly through a virtual
module. Add `@aurum/vite-plugin/client` to the `types` array in the application's
TypeScript configuration if the virtual import is used.

```ts
import config, { captureStacks, instrumentation, mode } from 'virtual:aurum-devtools/config';
```

The virtual module is side-effect free. Runtime configuration is selected by
the compile-time constants, avoiding bootstrap ordering problems.
