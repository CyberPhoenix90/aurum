import { assert } from 'chai';
import { Aurum, DataSource, Switch, DefaultSwitchCase, SwitchCase } from '../../src/aurum';

describe('Switch', () => {
	afterEach(() => {
		Aurum.detach(document.body);
	});

	it('Should not add anything to the DOM', () => {
		Aurum.attach(
			<div>
				<Switch state={new DataSource()}></Switch>
			</div>,
			document.body
		);
		assert(document.body.firstChild.childNodes.length === 0);
	});

	it('Should not add anything to the DOM with empty cases', () => {
		Aurum.attach(
			<div>
				<Switch state={new DataSource()}>
					<DefaultSwitchCase></DefaultSwitchCase>
				</Switch>
			</div>,
			document.body
		);
		assert(document.body.firstChild.childNodes.length === 0);
	});

	it('Should pick none if no match', () => {
		Aurum.attach(
			<div>
				<Switch state={new DataSource()}>
					<SwitchCase when={'whatever'}>
						<div>hello</div>
					</SwitchCase>
				</Switch>
			</div>,
			document.body
		);

		assert(document.body.firstChild.childNodes.length === 0);
	});

	it('Should pick default', () => {
		Aurum.attach(
			<div>
				<Switch state={new DataSource()}>
					<DefaultSwitchCase>
						<div>hello</div>
					</DefaultSwitchCase>
				</Switch>
			</div>,
			document.body
		);
		assert(document.body.firstChild.childNodes.length === 1);
		assert(document.body.firstChild.childNodes[0].textContent === 'hello');
	});

	it('Should pick correct', () => {
		Aurum.attach(
			<div>
				<Switch state={new DataSource('yes')}>
					<SwitchCase when="no">
						<div>hello</div>
					</SwitchCase>
					<SwitchCase when="yes">
						<div>world</div>
					</SwitchCase>
				</Switch>
			</div>,
			document.body
		);
		assert(document.body.firstChild.childNodes.length === 1);
		assert(document.body.firstChild.childNodes[0].textContent === 'world');
	});

	it('Should update', () => {
		const data = new DataSource('one');
		Aurum.attach(
			<div>
				<Switch state={data}>
					<SwitchCase when="one">
						<div>hello</div>
					</SwitchCase>
					<SwitchCase when="two">
						<div>world</div>
					</SwitchCase>
				</Switch>
			</div>,
			document.body
		);
		assert(document.body.firstChild.childNodes.length === 1);
		assert(document.body.firstChild.childNodes[0].textContent === 'hello');

		data.update('two');
		assert(document.body.firstChild.childNodes.length === 1);
		assert(document.body.firstChild.childNodes[0].textContent === 'world');

		data.update('three');
		assert(document.body.firstChild.childNodes.length === 0);
	});

	it('Nested switches should work', () => {
		const data = new DataSource('one');
		const data2 = new DataSource('one');

		Aurum.attach(
			<div>
				<Switch state={data}>
					<SwitchCase when="one">
						<Switch state={data2}>
							<SwitchCase when="one">
								<div>sub one</div>
							</SwitchCase>
							<SwitchCase when="two">
								<div>sub two</div>
							</SwitchCase>
						</Switch>
					</SwitchCase>
					<SwitchCase when="two">
						<Switch state={data2}>
							<SwitchCase when="one">
								<div>sub hello</div>
							</SwitchCase>
							<SwitchCase when="two">
								<div>sub world</div>
							</SwitchCase>
						</Switch>
					</SwitchCase>
				</Switch>
			</div>,
			document.body
		);
		assert(document.body.firstChild.childNodes.length === 1);
		assert(document.body.firstChild.childNodes[0].textContent === 'sub one');

		data2.update('two');
		assert(document.body.firstChild.childNodes.length === 1);
		assert(document.body.firstChild.childNodes[0].textContent === 'sub two');
		data2.update('one');

		data.update('two');
		assert(document.body.firstChild.childNodes.length === 1);
		assert(document.body.firstChild.childNodes[0].textContent === 'sub hello');

		data2.update('two');
		assert(document.body.firstChild.childNodes.length === 1);
		assert(document.body.firstChild.childNodes[0].textContent === 'sub world');

		data.update('three');
		assert(document.body.firstChild.childNodes.length === 0);
	});
});
