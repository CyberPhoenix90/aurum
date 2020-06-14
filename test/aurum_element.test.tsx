import { assert } from 'chai';
import { Aurum, Switch, SwitchCase, DataSource, CancellationToken } from '../src/aurum';

describe('Aurum Element', () => {
	let attachToken: CancellationToken;
	afterEach(() => {
		attachToken?.cancel();
		attachToken = undefined;
	});
	beforeEach(() => {
		jest.useFakeTimers();
	});

	it('Should be in DOM at onAttach', () => {
		return new Promise((resolve) => {
			attachToken = Aurum.attach(
				<div
					onAttach={(div) => {
						assert(div.isConnected);
						resolve();
					}}
				></div>,
				document.body
			);
		});
	});

	it('Should be in DOM at onAttach nested', () => {
		return new Promise((resolve) => {
			attachToken = Aurum.attach(
				<div>
					<div
						onAttach={(div) => {
							assert(div.isConnected);
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
			attachToken = Aurum.attach(
				<div
					onDetach={(div) => {
						assert(!div.isConnected);
						resolve();
					}}
				></div>,
				document.body
			);
			attachToken.cancel();
			attachToken = undefined;
		});
	});

	it('Should detach on removal', () => {
		const ds = new DataSource<boolean>(true);

		return new Promise((resolve) => {
			attachToken = Aurum.attach(
				<div>
					<Switch state={ds}>
						<SwitchCase when={true}>
							<div
								onDetach={() => {
									resolve();
								}}
							></div>
						</SwitchCase>
						<SwitchCase when={false}></SwitchCase>
					</Switch>
				</div>,
				document.body
			);

			ds.update(false);
		});
	});
});
