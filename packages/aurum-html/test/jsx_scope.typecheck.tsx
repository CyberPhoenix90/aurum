import { Aurum } from '../src/index.js';

const html = <div class="loaded"><input value="yes"></input></div>;
// @ts-expect-error className is not an HTML attribute; Aurum uses class.
const invalidClassAlias = <div className="unsupported" />;
void html;
void invalidClassAlias;
