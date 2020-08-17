import { assert } from 'chai';
import * as sinon from 'sinon';
import { SinonFakeTimers } from 'sinon';
import { CancellationToken } from '../src/aurum';

describe('cancellation token', () => {
	let clock: SinonFakeTimers;
	beforeEach(() => {
		clock = sinon.useFakeTimers();
	});
	afterEach(() => {
		clock.uninstall();
	});

	it('setTimeout should not fire if cancel occurs first', () => {
		const token = new CancellationToken();
		token.setTimeout(() => {
			assert(false);
		});
		token.cancel();
		clock.tick(100);
	});

	it('setTimeout should fire if cancel occurs after', () => {
		return new Promise((resolve) => {
			const token = new CancellationToken();
			token.setTimeout(() => {
				resolve();
			});
			clock.tick(100);
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
		clock.tick(100);
		assert(token['cancelables'].length === 0);
		token.cancel();
	});
});
