import { assert } from 'chai';
import { Aurum, DataSource, Div, P, Template } from '../src/aurumjs';
import { ownerSymbol } from '../src/utilities/owner_symbol';

describe('Aurum', () => {
	afterEach(() => {
		Aurum.detach(document.body);
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
		assert((document.body.firstChild as HTMLDivElement).innerText === 'Hello World');
	});

	it('Should set child node', () => {
		Aurum.attach(
			<Div>
				<P>Hello World</P>
			</Div>,
			document.body
		);
		assert(document.body.firstChild.firstChild instanceof HTMLParagraphElement);
		assert((document.body.firstChild.firstChild as HTMLDivElement).innerText === 'Hello World');
	});

	it('Should accept data sources', () => {
		const ds = new DataSource('123');
		Aurum.attach(
			<Div>
				<P>{ds}</P>
			</Div>,
			document.body
		);
		assert((document.body.firstChild.firstChild as HTMLDivElement).innerText === '123');
	});

	it('Should accept functional components', () => {
		const FuncComp = () => <Div>Functional</Div>;
		Aurum.attach(<FuncComp></FuncComp>, document.body);
		assert((document.body.firstChild as HTMLDivElement).innerText === 'Functional');
	});

	it('Should assign default template', () => {
		Aurum.attach(
			<Div>
				<Template generator={() => void 0}></Template>
			</Div>,
			document.body
		);
		assert(document.body.firstChild[ownerSymbol].template !== undefined);
	});

	it('Should assign explicit default template', () => {
		Aurum.attach(
			<Div>
				<Template ref="default" generator={() => void 0}></Template>
			</Div>,
			document.body
		);
		assert(document.body.firstChild[ownerSymbol].template !== undefined);
	});
});
