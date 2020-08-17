import { assert } from 'chai';
import { Aurum, DataSource, Switch, DefaultSwitchCase, SwitchCase } from '../../src/aurum';

describe('Switch', () => {
	let attachToken;
	afterEach(() => {
		attachToken?.cancel();
		attachToken = undefined;
	});

	it('Should not add anything to the DOM', () => {
		attachToken = Aurum.attach(
			<div>
				<Switch state={new DataSource()}></Switch>
			</div>,
			document.getElementById('target')
		);
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 0);
	});

	it('Should not add anything to the DOM with empty cases', () => {
		attachToken = Aurum.attach(
			<div>
				<Switch state={new DataSource()}>
					<DefaultSwitchCase></DefaultSwitchCase>
				</Switch>
			</div>,
			document.getElementById('target')
		);
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 0);
	});

	it('Should pick none if no match', () => {
		attachToken = Aurum.attach(
			<div>
				<Switch state={new DataSource()}>
					<SwitchCase when={'whatever'}>
						<div>hello</div>
					</SwitchCase>
				</Switch>
			</div>,
			document.getElementById('target')
		);

		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 0);
	});

	it('Should pick default', () => {
		attachToken = Aurum.attach(
			<div>
				<Switch state={new DataSource()}>
					<DefaultSwitchCase>
						<div>hello</div>
					</DefaultSwitchCase>
				</Switch>
			</div>,
			document.getElementById('target')
		);
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 1);
		assert(document.getElementById('target').firstChild.childNodes[1].textContent === 'hello');
	});

	it('Should pick correct', () => {
		attachToken = Aurum.attach(
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
			document.getElementById('target')
		);
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 1);
		assert(document.getElementById('target').firstChild.childNodes[1].textContent === 'world');
	});

	it('Should update', () => {
		const data = new DataSource('one');
		attachToken = Aurum.attach(
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
			document.getElementById('target')
		);
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 1);
		assert(document.getElementById('target').firstChild.childNodes[1].textContent === 'hello');

		data.update('two');
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 1);
		assert(document.getElementById('target').firstChild.childNodes[1].textContent === 'world');

		data.update('three');
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 0);
	});

	it('Nested switches should work', () => {
		const data = new DataSource('one');
		const data2 = new DataSource('one');

		attachToken = Aurum.attach(
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
			document.getElementById('target')
		);
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 1);
		assert(document.getElementById('target').firstChild.childNodes[2].textContent === 'sub one');

		data2.update('two');
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 1);
		assert(document.getElementById('target').firstChild.childNodes[2].textContent === 'sub two');
		data2.update('one');

		data.update('two');
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 1);
		assert(document.getElementById('target').firstChild.childNodes[2].textContent === 'sub hello');

		data2.update('two');
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 1);
		assert(document.getElementById('target').firstChild.childNodes[2].textContent === 'sub world');

		data.update('three');
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 0);
	});
});
