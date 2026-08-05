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
