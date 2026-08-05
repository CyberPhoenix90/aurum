import { assert, describe, it } from 'vitest';
import { Aurum, aurumToHTML } from '../../src/index.js';

describe('Aurum To HTML', () => {
    it('Should render HTML in place', () => {
        const { content } = aurumToHTML(<a class="abc" id="bcd" href="test"></a>);

        assert(content.tagName === 'A');
        assert(content.className === 'abc');
        assert(content.id === 'bcd');
        assert(content.getAttribute('href') === 'test');
    });

    it('should render SVG correctly', () => {
        const { content } = aurumToHTML(
            <svg height="150" width="400" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialgradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stop-color="red" />
                        <stop offset="100%" stop-color="blue" />
                    </radialgradient>
                </defs>
                <ellipse cx="100" cy="70" rx="85" ry="55" fill="url(#grad1)" />
            </svg>
        );

        assert(content.tagName === 'svg');
        assert(content.getAttribute('height') === '150');
        assert(content.getAttribute('width') === '400');
        assert(content.getAttribute('xmlns') === 'http://www.w3.org/2000/svg');
        assert(content.querySelector('ellipse') !== null);
        assert(content.querySelector('ellipse').getAttribute('cx') === '100');
        assert(content.querySelector('ellipse').getAttribute('cy') === '70');
        assert(content.querySelector('ellipse').getAttribute('rx') === '85');
        assert(content.querySelector('ellipse').getAttribute('ry') === '55');
        assert(content.querySelector('ellipse').getAttribute('fill') === 'url(#grad1)');
        assert(content.querySelector('defs') !== null);
        assert(content.querySelector('defs').querySelector('radialGradient') !== null);
        assert(content.querySelector('defs').querySelector('radialGradient').getAttribute('id') === 'grad1');
        assert(content.querySelector('defs').querySelector('radialGradient').getAttribute('cx') === '50%');
        assert(content.querySelector('defs').querySelector('radialGradient').getAttribute('cy') === '50%');
        assert(content.querySelector('defs').querySelector('radialGradient').getAttribute('r') === '50%');
        assert(content.querySelector('defs').querySelector('radialGradient').getAttribute('fx') === '50%');
        assert(content.querySelector('defs').querySelector('radialGradient').getAttribute('fy') === '50%');
        assert(content.querySelector('defs').querySelector('radialGradient').querySelector('stop').getAttribute('offset') === '0%');
        assert(content.querySelector('defs').querySelector('radialGradient').querySelector('stop').getAttribute('stop-color') === 'red');
    });
});
