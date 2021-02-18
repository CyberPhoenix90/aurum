import { Aurum, ArrayDataSource } from '../../src/aurumjs';
import { assert } from 'chai';

describe('Nodes', () => {
	[
		'Address',
		'Kbd',
		'Samp',
		'Object',
		'OptGroup',
		'Picture',
		'Output',
		'Param',
		'Strong',
		'Track',
		'Var',
		'Wbr',
		'Button',
		'Code',
		'Hr',
		'Div',
		'Input',
		'Li',
		'Span',
		'Style',
		'Ul',
		'P',
		'Img',
		'Link',
		'Canvas',
		'A',
		'Article',
		'Br',
		'Form',
		'Label',
		'Ol',
		'Pre',
		'Progress',
		'Table',
		'Td',
		'Tr',
		'Th',
		'TextArea',
		'H1',
		'H2',
		'H3',
		'H4',
		'H5',
		'H6',
		'Html',
		'Head',
		'Header',
		'Footer',
		'Nav',
		'B',
		'I',
		'Script',
		'Abbr',
		'Area',
		'Aside',
		'Audio',
		'Em',
		'Heading',
		'IFrame',
		'NoScript',
		'Option',
		'Q',
		'Select',
		'Source',
		'Title',
		'Video',
		'TBody',
		'TFoot',
		'Meta',
		'Body',
		'THead',
		'Summary',
		'Details',
		'Sub',
		'Sup',
		'Svg',
		'Data',
		'Time',
		'Template',
		'Slot'
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
