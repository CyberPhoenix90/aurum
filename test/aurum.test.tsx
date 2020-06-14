import { assert } from 'chai';
import { Aurum, DataSource, CancellationToken } from '../src/aurum';
describe('Aurum', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	let attachToken: CancellationToken;
	afterEach(() => {
		attachToken?.cancel();
		attachToken = undefined;
	});

	it('should attach dom node', () => {
		assert(document.body.firstChild === null);
		attachToken = Aurum.attach(<div></div>, document.body);
		assert(document.body.firstChild !== null);
	});

	it('Should set inner text', () => {
		attachToken = Aurum.attach(<div>Hello World</div>, document.body);
		jest.runAllTimers();
		assert((document.body.firstChild as HTMLDivElement).textContent === 'Hello World');
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
				document.body
			);
			jest.runAllTimers();
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
				document.body
			);
			jest.runAllTimers();
			attachToken.cancel();
			attachToken = undefined;
		});
	});

	it('Should set child node', () => {
		attachToken = Aurum.attach(
			<div>
				<p>Hello World</p>
			</div>,
			document.body
		);
		jest.runAllTimers();
		assert(document.body.firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.body.firstChild.firstChild as HTMLDivElement).textContent === 'Hello World');
	});

	it('should accept booleans for attributes 1', () => {
		attachToken = Aurum.attach(
			<div>
				<p id={false}>Hello World</p>
			</div>,
			document.body
		);
		assert(document.body.firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.body.firstChild.firstChild as HTMLDivElement).hasAttribute('id') === false);
	});

	it('should accept booleans for attributes 2', () => {
		attachToken = Aurum.attach(
			<div>
				<p id={true}>Hello World</p>
			</div>,
			document.body
		);
		assert(document.body.firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.body.firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
		assert((document.body.firstChild.firstChild as HTMLDivElement).getAttribute('id') === '');
	});

	it('should accept booleans datasources for attributes', () => {
		const ds = new DataSource(false);
		attachToken = Aurum.attach(
			<div>
				<p id={ds}>Hello World</p>
			</div>,
			document.body
		);
		assert(document.body.firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.body.firstChild.firstChild as HTMLDivElement).hasAttribute('id') === false);

		ds.update(true);

		assert((document.body.firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
		assert((document.body.firstChild.firstChild as HTMLDivElement).getAttribute('id') === '');

		ds.update(false);

		assert((document.body.firstChild.firstChild as HTMLDivElement).hasAttribute('id') === false);
	});

	it('should accept text for attributes', () => {
		attachToken = Aurum.attach(
			<div>
				<p id="test">Hello World</p>
			</div>,
			document.body
		);
		assert(document.body.firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.body.firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
		assert((document.body.firstChild.firstChild as HTMLDivElement).getAttribute('id') === 'test');
	});

	it('should accept string datasources for attributes', () => {
		const ds = new DataSource('');
		attachToken = Aurum.attach(
			<div>
				<p id={ds}>Hello World</p>
			</div>,
			document.body
		);
		assert(document.body.firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.body.firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
		assert((document.body.firstChild.firstChild as HTMLDivElement).getAttribute('id') === '');

		ds.update('test');

		assert((document.body.firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
		assert((document.body.firstChild.firstChild as HTMLDivElement).getAttribute('id') === 'test');
	});

	it('Should accept data sources', () => {
		const ds = new DataSource('123');
		attachToken = Aurum.attach(
			<div>
				<p>{ds}</p>
			</div>,
			document.body
		);
		jest.runAllTimers();
		assert((document.body.firstChild.firstChild as HTMLDivElement).textContent === '123');
	});

	it('Should accept functional components', () => {
		const FuncComp = () => <div>Functional</div>;
		attachToken = Aurum.attach(<FuncComp></FuncComp>, document.body);
		jest.runAllTimers();
		assert((document.body.firstChild as HTMLDivElement).textContent === 'Functional');
	});
});
