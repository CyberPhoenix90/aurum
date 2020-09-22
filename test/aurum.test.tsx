import { assert } from 'chai';
import * as sinon from 'sinon';
import { Aurum, DataSource, CancellationToken } from '../src/aurumjs';
describe('Aurum', () => {
	let clock: sinon.SinonFakeTimers;
	beforeEach(() => {
		clock = sinon.useFakeTimers();
	});

	let attachToken: CancellationToken;
	afterEach(() => {
		clock.uninstall();
		attachToken?.cancel();
		attachToken = undefined;
	});

	it('should attach dom node', () => {
		assert(document.getElementById('target').firstChild === null);
		attachToken = Aurum.attach(<div></div>, document.getElementById('target'));
		assert(document.getElementById('target').firstChild !== null);
	});

	it('Should set inner text', () => {
		attachToken = Aurum.attach(<div>Hello World</div>, document.getElementById('target'));
		clock.tick(100);
		assert((document.getElementById('target').firstChild as HTMLDivElement).textContent === 'Hello World');
	});

	it('Should fire onAttach when connected to dom', () => {
		return new Promise((resolve) => {
			attachToken = Aurum.attach(
				<div
					onAttach={(ele) => {
						assert(ele.isConnected);
						resolve();
					}}
				>
					Hello World
				</div>,
				document.getElementById('target')
			);
			clock.tick(100);
		});
	});

	it('Should fire onDetach when disconnected from dom', () => {
		return new Promise((resolve) => {
			attachToken = Aurum.attach(
				<div
					onDetach={(ele) => {
						assert(!ele.isConnected);
						resolve();
					}}
				>
					Hello World
				</div>,
				document.getElementById('target')
			);
			clock.tick(100);
			attachToken.cancel();
			attachToken = undefined;
		});
	});

	it('Should set child node', () => {
		attachToken = Aurum.attach(
			<div>
				<p>Hello World</p>
			</div>,
			document.getElementById('target')
		);
		clock.tick(100);
		assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).textContent === 'Hello World');
	});

	it('should accept booleans for attributes 1', () => {
		attachToken = Aurum.attach(
			<div>
				<p id={false}>Hello World</p>
			</div>,
			document.getElementById('target')
		);
		assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === false);
	});

	it('should accept booleans for attributes 2', () => {
		attachToken = Aurum.attach(
			<div>
				<p id={true}>Hello World</p>
			</div>,
			document.getElementById('target')
		);
		assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).getAttribute('id') === '');
	});

	it('should accept booleans datasources for attributes', () => {
		const ds = new DataSource(false);
		attachToken = Aurum.attach(
			<div>
				<p id={ds}>Hello World</p>
			</div>,
			document.getElementById('target')
		);
		assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === false);

		ds.update(true);

		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).getAttribute('id') === '');

		ds.update(false);

		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === false);
	});

	it('should accept text for attributes', () => {
		attachToken = Aurum.attach(
			<div>
				<p id="test">Hello World</p>
			</div>,
			document.getElementById('target')
		);
		assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).getAttribute('id') === 'test');
	});

	it('should accept string datasources for attributes', () => {
		const ds = new DataSource('');
		attachToken = Aurum.attach(
			<div>
				<p id={ds}>Hello World</p>
			</div>,
			document.getElementById('target')
		);
		assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).getAttribute('id') === '');

		ds.update('test');

		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).getAttribute('id') === 'test');
	});

	it('Should accept data sources', () => {
		const ds = new DataSource('123');
		attachToken = Aurum.attach(
			<div>
				<p>{ds}</p>
			</div>,
			document.getElementById('target')
		);
		clock.tick(100);
		assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).textContent === '123');
	});

	it('Should accept functional components', () => {
		const FuncComp = () => <div>Functional</div>;
		attachToken = Aurum.attach(<FuncComp></FuncComp>, document.getElementById('target'));
		clock.tick(100);
		assert((document.getElementById('target').firstChild as HTMLDivElement).textContent === 'Functional');
	});
});
