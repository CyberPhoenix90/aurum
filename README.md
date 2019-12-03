<p align="center">
  <img src="https://i.imgur.com/Ru8maJS.png" width="100" alt="Aurum">
</p>

# Fast and concise declarative DOM rendering library for javascript

[![Build Status](https://travis-ci.com/CyberPhoenix90/aurum.svg?branch=master)](https://travis-ci.com/CyberPhoenix90/aurum)
![npm](https://img.shields.io/npm/dw/aurumjs)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/aurumjs)

Aurumjs is a DOM rendering library inspired by react and angular.
In Aurum you define your DOM using JSX and each thing that can change, be it attributes or inner text can be assigned to a data source.
There is no rerendering, no reconciliation, no watching no dirty checking and no guesswork on what will and will cause things to render.

Instead all the things that can change are bound to a so called data source which makes data mutations
observable and then applies the changes directly to the DOM bypassing any need for virtual dom or heavy computations of any sort.
This makes it very fast to apply updates while keeping the code short.

This project is and will always be dependency free for better security and performance
This project is still under development but feel free to try it and make bug reports or suggestions.

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
        "jsxFactory": "Aurum.factory"
    }
```

Simple Aurum app to render a div with text in the DOM:

```
import {Aurum, Div} from 'aurumjs'

Aurum.attach((<Div>Hello Aurum</Div>), document.body)
```

TODO App with creation, deletion drag and drop, editing and marking as done of tasks all under 100 lines of code with aurum:
https://codepen.io/cyberphoenix90/pen/LYYMwVr

Better examples, proper documentation and benchmarks will be added in the near future.
