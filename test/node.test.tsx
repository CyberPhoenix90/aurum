import { Aurum } from '../src/aurum';
import { assert } from 'chai';

describe('Nodes', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

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
			jest.runAllTimers();
			try {
				assert(document.body.firstChild.nodeName.toLowerCase() === n);
			} finally {
				Aurum.detach(document.body);
			}
		});
	});
});
