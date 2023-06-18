<p align="center">
  <img src="https://i.imgur.com/Ru8maJS.png" width="100" alt="Aurum">
</p>

# Fast and concise declarative DOM rendering library for javascript

[![Build Status](https://travis-ci.com/CyberPhoenix90/aurum.svg?branch=master)](https://travis-ci.com/CyberPhoenix90/aurum)
![npm](https://img.shields.io/npm/dw/aurumjs)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/aurumjs)

## What is Aurum

Aurum.js is a DOM rendering library inspired by react and angular.
In Aurum you use stream based programing (Similar to rx.js) for data management. You link your streams directly to the DOM be it into attributes, inner text or inner html, you keep your UI up to date all through streams.
Components in aurum never "rerender" react style, there is no reconciliation, no watching no dirty checking and no guesswork on what will cause things to render because all DOM changes are directly tied to a data stream.

## Why use Aurum

-   Aurum encourages writing UIs in a way that makes them update faster in response to data changes than even in popular modern libraries like react, vue or angular without the need for memoization, immutability or pure components.

-   Aurum does most of the data management overhead for you, saving time and allowing to focus on what matters: Implementing your business logic

-   Aurum has very few concepts and a small API, you can get a full understanding of Aurum.js in record time.

-   Aurum is completely built around the stream pattern, pipe your data from the backend over adapters all the way into the DOM

-   Aurum is not a framework. It does not impose how you should write your app and it plays nice with other libraries. You can even mix react and aurum in the same page if you want to.

## Browser support

-   All chromium based browsers

-   Firefox

-   Safari

## Getting started

Install:

> \$ npm install aurumjs

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
        "jsxFactory": "Aurum.factory",
        "jsxFragmentFactory": "Aurum.fragment",

    }
```

Simple Aurum app to render a div with text in the DOM:

```
import {Aurum} from 'aurumjs'

Aurum.attach((<div>Hello Aurum</div>), document.body)
```

## Website with documentation and further explanations

https://cyberphoenix90.github.io/aurum-website/

## Live example

TODO App with creation, deletion drag and drop, editing and marking as done of tasks all under 100 lines of code with aurum:
https://codepen.io/cyberphoenix90/pen/LYYMwVr
