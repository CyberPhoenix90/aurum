import { assert } from 'chai';
import { CancellationToken } from '../src/aurum';

describe('cancellation token', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	it('setTimeout should not fire if cancel occurs first', () => {
		const token = new CancellationToken();
		token.setTimeout(() => {
			assert(false);
		});
		token.cancel();
		jest.runAllTimers();
	});

	it('setTimeout should fire if cancel occurs after', () => {
		return new Promise((resolve) => {
			const token = new CancellationToken();
			token.setTimeout(() => {
				resolve();
			});
			jest.runAllTimers();
			token.cancel();
		});
	});

	it('setTimeout should be removed from list of cancellables once fired', () => {
		const token = new CancellationToken();
		token.setTimeout(() => {});
		assert(token['cancelables'].length === 1);
		token.setTimeout(() => {});
		assert(token['cancelables'].length === 2);
		token.setTimeout(() => {});
		assert(token['cancelables'].length === 3);
		jest.runAllTimers();
		assert(token['cancelables'].length === 0);
		token.cancel();
	});
});
