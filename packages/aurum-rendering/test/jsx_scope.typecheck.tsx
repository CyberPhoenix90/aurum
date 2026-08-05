import { Aurum, Renderable } from '../src/index.js';

function Component(): Renderable {
    return undefined;
}

const component = <Component></Component>;
// @ts-expect-error Renderer-only JSX must not imply that HTML is installed.
const invalidIntrinsic = <div></div>;
void component;
void invalidIntrinsic;
