import { assert } from 'chai';
import { Aurum, DataSource, Div, P } from '../src/aurum';
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
		Aurum.attach(<Div></Div>, document.body);
		assert(document.body.firstChild !== null);
	});

	it("can't attach to node that already has aurum node", () => {
		Aurum.attach(<Div></Div>, document.body);
		assert.throws(() => {
			Aurum.attach(<Div></Div>, document.body);
		});
	});

	it('Should set inner text', () => {
		Aurum.attach(<Div>Hello World</Div>, document.body);
		jest.runAllTimers();
		assert((document.body.firstChild as HTMLDivElement).textContent === 'Hello World');
	});

	it('Should fire onAttach when connected to dom', () => {
		return new Promise((resolve) => {
			Aurum.attach(
				<Div
					onAttach={(ele) => {
						assert(ele.node.isConnected);
						resolve();
					}}
				>
					Hello World
				</Div>,
				document.body
			);
			jest.runAllTimers();
		});
	});

	it('Should fire onDetach when disconnected from dom', () => {
		return new Promise((resolve) => {
			Aurum.attach(
				<Div
					onAttach={(e) => Aurum.detach(e.node)}
					onDetach={(ele) => {
						assert(!ele.node.isConnected);
						resolve();
					}}
				>
					Hello World
				</Div>,
				document.body
			);
			jest.runAllTimers();
		});
	});

	it('Should set child node', () => {
		Aurum.attach(
			<Div>
				<P>Hello World</P>
			</Div>,
			document.body
		);
		jest.runAllTimers();
		assert(document.body.firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.body.firstChild.firstChild as HTMLDivElement).textContent === 'Hello World');
	});

	it('Should accept data sources', () => {
		const ds = new DataSource('123');
		Aurum.attach(
			<Div>
				<P>{ds}</P>
			</Div>,
			document.body
		);
		jest.runAllTimers();
		assert((document.body.firstChild.firstChild as HTMLDivElement).textContent === '123');
	});

	it('Should accept functional components', () => {
		const FuncComp = () => <Div>Functional</Div>;
		Aurum.attach(<FuncComp></FuncComp>, document.body);
		jest.runAllTimers();
		assert((document.body.firstChild as HTMLDivElement).textContent === 'Functional');
	});
});
