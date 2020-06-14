import { Aurum, ArrayDataSource } from '../../src/aurum';
import { assert } from 'chai';

describe('Nodes', () => {
	[
		'A',
		'Abbr',
		'Area',
		'Article',
		'Aside',
		'Audio',
		'B',
		'Br',
		'Button',
		'Canvas',
		'Data',
		'Details',
		'Div',
		'Em',
		'Footer',
		'Form',
		'H1',
		'H2',
		'H3',
		'H4',
		'H5',
		'H6',
		'Head',
		'Header',
		'Heading',
		'I',
		'IFrame',
		'Img',
		'Label',
		'Li',
		'Link',
		'Nav',
		'NoScript',
		'Ol',
		'Option',
		'P',
		'Pre',
		'Progress',
		'Q',
		'Script',
		'Source',
		'Span',
		'Style',
		'Sub',
		'Summary',
		'Sup',
		'Svg',
		'Table',
		'TBody',
		'Td',
		'Template',
		'TFoot',
		'Th',
		'THead',
		'Time',
		'Title',
		'Tr',
		'Ul',
		'Video',
		'Slot',
		'Code',
		'Hr'
	].forEach((n) => {
		it('should render node ' + n, () => {
			let attachToken = Aurum.attach(Aurum.factory(n.toLowerCase(), {}, null), document.body);
			try {
				assert(document.body.firstChild.nodeName.toLowerCase() === n.toLowerCase());
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
			document.body
		);
		try {
			assert((document.body.firstChild as HTMLDivElement).childElementCount === repeatModel.length.value);
			assert((document.body.firstChild as HTMLDivElement).textContent === '1234');
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
			attachToken.cancel();
		}
	});
});
