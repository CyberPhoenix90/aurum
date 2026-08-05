# Aurum monorepo

The framework is split into focused scoped packages:

- `@aurum/streams` for reactive state and transformations
- `@aurum/rendering` for the platform-neutral component engine
- `@aurum/html` for HTML nodes and browser/string/VDOM adapters
- `@aurum/remote` and `@aurum/server` for remote data sources and RPC
- `@aurum/canvas` and `@aurum/components` for the higher-level libraries

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

## Create npm packages

```sh
npm run package
```

This builds every workspace and writes publishable tarballs to `artifacts/`. To inspect one without publishing, run `npm pack --dry-run --workspace @aurum/html`.
