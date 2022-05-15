Aurumjs is a DOM rendering library inspired by react and angular.

## Getting started

Install:

> $ npm install aurumjs

To use Aurum you need to compile JSX or TSX using babel or the typescript compiler.

### With Babel

Example .babelrc

```
{
  "presets": [
    "@babel/preset-env",
  ],
  "plugins": [
    [
      "@babel/transform-react-jsx",
      {
        "pragma": "Aurum.factory"
      }
    ]
  ]
}
```

### With typescript

In tsconfig.json put the jsxFactory option

```
    "compilerOptions": {
        "jsxFactory": "Aurum.factory"
    }
```
