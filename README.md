# aurum
Fast and concise declarative DOM rendering library for javascript

Aurum is a DOM rendering library inspired by react and angular. 
In Aurum you define your DOM using JSX and each thing that can change, be it attributes or inner text can be assigned to a data source.
There is no rerendering, no reconciliation, no watching no dirty checking and no guesswork on what will and will cause things to render.

Instead all the things that can change are bound to a so called data source which makes data mutations 
observable and then applies the changes directly to the DOM bypassing any need for virtual dom or heavy computations of any sort. 
This makes it very fast to apply updates while keeping the code short.
