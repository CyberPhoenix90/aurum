import { DataSource } from '../src/index.js';

const source = new DataSource(1);
source.update(2);

// @ts-expect-error Loading streams alone must not enable any JSX intrinsic tags.
const invalidIntrinsic = <div></div>;
void invalidIntrinsic;
