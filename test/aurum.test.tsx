import { assert } from 'chai';
import { Aurum, DataSource } from '../src/aurum';
import { ownerSymbol } from '../src/utilities/owner_symbol';
describe('Aurum', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		if (document.body[ownerSymbol]) {
			Aurum.detach(document.body);
		}
	});

	it('should attach dom node', () => {
		assert(document.body.firstChild === null);
		Aurum.attach(<div></div>, document.body);
		assert(document.body.firstChild !== null);
	});

	it("can't attach to node that already has aurum node", () => {
		Aurum.attach(<div></div>, document.body);
		assert.throws(() => {
			Aurum.attach(<div></div>, document.body);
		});
	});

	it('Should set inner text', () => {
		Aurum.attach(<div>Hello World</div>, document.body);
		jest.runAllTimers();
		assert((document.body.firstChild as HTMLDivElement).textContent === 'Hello World');
	});

	it('Should fire onAttach when connected to dom', () => {
		return new Promise((resolve) => {
			Aurum.attach(
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
			Aurum.attach(
				<div
					onAttach={(e) => Aurum.detach(e)}
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
		});
	});

	it('Should set child node', () => {
		Aurum.attach(
			<div>
				<p>Hello World</p>
			</div>,
			document.body
		);
		jest.runAllTimers();
		assert(document.body.firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.body.firstChild.firstChild as HTMLDivElement).textContent === 'Hello World');
	});

	it('Should accept data sources', () => {
		const ds = new DataSource('123');
		Aurum.attach(
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
		Aurum.attach(<FuncComp></FuncComp>, document.body);
		jest.runAllTimers();
		assert((document.body.firstChild as HTMLDivElement).textContent === 'Functional');
	});
});
