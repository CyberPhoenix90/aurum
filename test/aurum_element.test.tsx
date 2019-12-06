import { assert } from 'chai';
import { Aurum } from '../src/aurum';

describe('Aurum Element', () => {
	afterEach(() => {
		Aurum.detach(document.body);
	});
	beforeEach(() => {
		jest.useFakeTimers();
	});

	it('Should be in DOM at onAttach', () => {
		return new Promise((resolve) => {
			Aurum.attach(
				<div
					onAttach={(div) => {
						assert(div.node.isConnected);
						resolve();
					}}
				></div>,
				document.body
			);
		});
	});

	it('Should be in DOM at onAttach nested', () => {
		return new Promise((resolve) => {
			Aurum.attach(
				<div>
					<div
						onAttach={(div) => {
							assert(div.node.isConnected);
							resolve();
						}}
					></div>
				</div>,
				document.body
			);
		});
	});

	it('Should not be in DOM at onDetach', () => {
		return new Promise((resolve) => {
			Aurum.attach(
				<div
					onDetach={(div) => {
						assert(!div.node.isConnected);
						resolve();
					}}
				></div>,
				document.body
			);
			Aurum.detach(document.body);
		});
	});
});
