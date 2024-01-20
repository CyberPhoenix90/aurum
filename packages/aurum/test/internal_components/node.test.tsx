import { assert, describe, it } from 'vitest';
import { ArrayDataSource, Aurum } from '../../src/aurumjs.js';

describe('Nodes', () => {
    [
        'address',
        'kbd',
        'samp',
        'object',
        'optgroup',
        'picture',
        'output',
        'param',
        'strong',
        'track',
        'var',
        'wbr',
        'button',
        'code',
        'hr',
        'div',
        'input',
        'li',
        'span',
        'style',
        'ul',
        'p',
        'img',
        'link',
        'canvas',
        'a',
        'article',
        'br',
        'form',
        'label',
        'ol',
        'pre',
        'progress',
        'table',
        'td',
        'tr',
        'th',
        'textarea',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'html',
        'head',
        'header',
        'footer',
        'nav',
        'b',
        'i',
        'script',
        'abbr',
        'area',
        'aside',
        'audio',
        'em',
        'heading',
        'iframe',
        'noscript',
        'option',
        'q',
        'select',
        'source',
        'title',
        'video',
        'tbody',
        'tfoot',
        'meta',
        'body',
        'thead',
        'summary',
        'details',
        'sub',
        'sup',
        'svg',
        'data',
        'time',
        'template',
        'slot',
        'col',
        'colgroup',
        'caption',
        'line',
        'rect',
        'defs',
        'g',
        'text',
        'tspan',
        'circle',
        'ellipse',
        'polygon',
        'polyline',
        'path',
        'image',
        'symbol',
        'use',
        'stop',
        'linearGradient',
        'radialGradient',
        'clipPath',
        'pattern',
        'mask',
        'foreignObject',
        'marker'
    ].forEach((n) => {
        it('should render node ' + n, () => {
            let attachToken = Aurum.attach(Aurum.factory(n.toLowerCase(), {}, null), document.getElementById('target'));
            try {
                assert(document.getElementById('target').firstChild.nodeName.toLowerCase() === n.toLowerCase());
            } finally {
                attachToken.cancel();
            }
        });
    });

    it('should bind array data source ', () => {
        const repeatModel = new ArrayDataSource([1, 2, 3, 4]);

        let attachToken = Aurum.attach(
            <div>
                {repeatModel.map((i) => (
                    <div>{i}</div>
                ))}
            </div>,
            document.getElementById('target')
        );
        try {
            assert((document.getElementById('target').firstChild as HTMLDivElement).childElementCount === repeatModel.length.value);
            assert((document.getElementById('target').firstChild as HTMLDivElement).textContent === '1234');
        } finally {
            attachToken.cancel();
        }
    });

    it('repeat should sync with changes ', () => {
        const repeatModel = new ArrayDataSource([1, 2, 3, 4]);

        let attachToken = Aurum.attach(
            <div>
                {repeatModel.map((i) => (
                    <div>{i}</div>
                ))}
            </div>,
            document.getElementById('target')
        );
        try {
            assert((document.getElementById('target').firstChild as HTMLDivElement).childElementCount === repeatModel.length.value);
            repeatModel.push(5);
            assert((document.getElementById('target').firstChild as HTMLDivElement).childElementCount === repeatModel.length.value);
            assert((document.getElementById('target').firstChild as HTMLDivElement).textContent === '12345');
            repeatModel.swap(0, 2);
            assert((document.getElementById('target').firstChild as HTMLDivElement).textContent === '32145');
            repeatModel.unshift(7);
            assert((document.getElementById('target').firstChild as HTMLDivElement).textContent === '732145');
            repeatModel.removeRight(1);
            assert((document.getElementById('target').firstChild as HTMLDivElement).textContent === '73214');
            repeatModel.removeLeft(2);
            assert((document.getElementById('target').firstChild as HTMLDivElement).textContent === '214');
            repeatModel.clear();
            assert((document.getElementById('target').firstChild as HTMLDivElement).textContent === '');
        } finally {
            attachToken.cancel();
        }
    });
});
