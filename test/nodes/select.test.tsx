import { assert } from 'chai';
import { Aurum, DataSource } from '../../src/aurum';

describe('Select', () => {
	afterEach(() => {
		Aurum.detach(document.body);
	});

	it('Should apply initial selection', () => {
		Aurum.attach(
			<select selectedIndex={1}>
				<option>1</option>
				<option>2</option>
			</select>,
			document.body
		);
		assert((document.body.firstChild as HTMLSelectElement).selectedIndex === 1);
	});

	it('Should apply selection source', () => {
		const source = new DataSource(1);
		Aurum.attach(
			<select selectedIndex={source}>
				<option>1</option>
				<option>2</option>
				<option>3</option>
			</select>,
			document.body
		);
		assert((document.body.firstChild as HTMLSelectElement).selectedIndex === 1);
		source.update(2);
		assert((document.body.firstChild as HTMLSelectElement).selectedIndex === 2);
	});
});
