import { assert, describe, it } from 'vitest';
import { aurumToHTML } from '../../src/aurumjs.js';
import { Aurum } from '../../src/utilities/aurum.js';

describe('Aurum To HTML', () => {
    it('Should render HTML in place', () => {
        const { content } = aurumToHTML(<a class="abc" id="bcd" href="test"></a>);

        assert(content.tagName === 'A');
        assert(content.className === 'abc');
        assert(content.id === 'bcd');
        assert(content.getAttribute('href') === 'test');
    });
});
