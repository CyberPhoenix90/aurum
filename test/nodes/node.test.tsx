import { Aurum, Template, ArrayDataSource } from '../../src/aurum';
import { assert } from 'chai';

describe('Nodes', () => {
	[
		'button',
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
		'thead',
		'summary',
		'details',
		'sub',
		'sup',
		'svg',
		'data',
		'time',
		'template'
	].forEach((n) => {
		it('should render node ' + n, () => {
			Aurum.attach(Aurum.factory(n, {}, null), document.body);
			try {
				assert(document.body.firstChild.nodeName.toLowerCase() === n);
			} finally {
				Aurum.detach(document.body);
			}
		});
	});

	it('should repeat template ', () => {
		const repeatModel = new ArrayDataSource([1, 2, 3, 4]);

		Aurum.attach(
			<div repeatModel={repeatModel}>
				<Template generator={(i) => <div>{i}</div>}></Template>
			</div>,
			document.body
		);
		try {
			assert((document.body.firstChild as HTMLDivElement).childElementCount === repeatModel.length.value);
			assert((document.body.firstChild as HTMLDivElement).textContent === '1234');
		} finally {
			Aurum.detach(document.body);
		}
	});

	it('repeat should sync with changes ', () => {
		const repeatModel = new ArrayDataSource([1, 2, 3, 4]);

		Aurum.attach(
			<div repeatModel={repeatModel}>
				<Template generator={(i) => <div>{i}</div>}></Template>
			</div>,
			document.body
		);
		try {
			assert((document.body.firstChild as HTMLDivElement).childElementCount === repeatModel.length.value);
			repeatModel.push(5);
			assert((document.body.firstChild as HTMLDivElement).childElementCount === repeatModel.length.value);
			assert((document.body.firstChild as HTMLDivElement).textContent === '12345');
			repeatModel.swap(0, 2);
			assert((document.body.firstChild as HTMLDivElement).textContent === '32145');
			repeatModel.unshift(7);
			assert((document.body.firstChild as HTMLDivElement).textContent === '732145');
			repeatModel.removeRight(1);
			assert((document.body.firstChild as HTMLDivElement).textContent === '73214');
			repeatModel.removeLeft(2);
			assert((document.body.firstChild as HTMLDivElement).textContent === '214');
			repeatModel.clear();
			assert((document.body.firstChild as HTMLDivElement).textContent === '');
		} finally {
			Aurum.detach(document.body);
		}
	});
});
