# Aurum monorepo

The framework is split into focused scoped packages:

- `@aurum/streams` for reactive state and transformations
- `@aurum/rendering` for the platform-neutral component engine
- `@aurum/html` for HTML nodes and browser/string/VDOM adapters
- `@aurum/remote` and `@aurum/server` for remote data sources and RPC
- `@aurum/canvas` and `@aurum/components` for the higher-level libraries
- `@aurum/vite-plugin` for debug/production developer-tool metadata policy
- `@aurum/devtools-extension` for the Chromium DevTools data-flow inspector

This repository uses [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) for all packages.

## Development

Node.js 20 or newer is required.

```sh
npm install
npm run test:install-browser
npm run build
npm test
```

The browser installation is a one-time Playwright setup. The root build and test commands run the corresponding script in dependency order across all workspaces.

## Developer tools

Add the Vite plugin to an application to retain rich source, transformation,
subscription, component, and render-binding metadata during development:

```ts
import { aurumDevtools } from '@aurum/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [aurumDevtools()]
});
```

Development servers and non-production builds capture values, names,
annotations, relationship labels, and creation stacks. Production builds keep
only the live topology, source kinds, versions, and subscription counts, so the
extension remains useful without exposing application values or paying for rich
renderer metadata and stack capture. That production policy is compile-time
locked; create an explicit diagnostic build when richer inspection is needed.

Build the unpacked Chromium extension with:

```sh
npm run devtools:build
```

Then load `packages/aurum-devtools-extension/dist` through the browser's
extension page and open the **Aurum** panel in DevTools.

## Create npm packages

```sh
npm run package
```

This builds every workspace and writes publishable tarballs to `artifacts/`. To inspect one without publishing, run `npm pack --dry-run --workspace @aurum/html`.
