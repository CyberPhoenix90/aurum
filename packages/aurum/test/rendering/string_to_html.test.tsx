import { afterEach, assert, describe, it } from 'vitest';
import { Aurum, CancellationToken, aurumToString } from '../../src/aurumjs.js';

describe('String to HTML', () => {
    let attachToken: CancellationToken | undefined;
    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('Should turn string to HTML', async () => {
        const result = await aurumToString(<a class="abc" id="bcd" href="test"></a>);
        attachToken = Aurum.stringToInnerHTML(result, document.getElementById('target'), {});

        assert.equal(document.getElementById('target').querySelector('a').getAttribute('class'), 'abc');
        assert.equal(document.getElementById('target').querySelector('a').getAttribute('id'), 'bcd');
    });

    it('Should render nested with text', async () => {
        const result = await aurumToString(
            <a class="abc" id="bcd" href="test">
                <div>test</div>
            </a>
        );

        attachToken = Aurum.stringToInnerHTML(result, document.getElementById('target'), {});

        assert.equal(document.getElementById('target').querySelector('a').getAttribute('class'), 'abc');
        assert.equal(document.getElementById('target').querySelector('a').getAttribute('id'), 'bcd');
        assert(document.getElementById('target').querySelector('a').querySelector('div'));
        assert.equal(document.getElementById('target').querySelector('a').querySelector('div').textContent, 'test');
    });
});
