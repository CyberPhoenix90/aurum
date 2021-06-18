import { assert } from 'chai';
import { Aurum, Suspense } from '../../src/aurumjs';

describe('Suspense', () => {
	let attachToken;

	afterEach(() => {
		attachToken?.cancel();
		attachToken = undefined;
	});

	it('Should not add anything to the DOM', () => {
		attachToken = Aurum.attach(
			<div>
				<Suspense></Suspense>
			</div>,
			document.getElementById('target')
		);
		assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 0);
	});

	it('Should not suspend if content is not a promise', () => {
		attachToken = Aurum.attach(
			<div>
				<Suspense fallback="1">{'2'}</Suspense>
			</div>,
			document.getElementById('target')
		);
		assert(document.getElementById('target').firstChild.textContent === '2');
	});

	it('Should suspend if content is a promise', () => {
		attachToken = Aurum.attach(
			<div>
				<Suspense fallback="1">{new Promise(() => void 0)}</Suspense>
			</div>,
			document.getElementById('target')
		);
		assert(document.getElementById('target').firstChild.textContent === '1');
	});

	it('Should remove suspense after promise resolves', async () => {
		attachToken = Aurum.attach(
			<div>
				<Suspense fallback="1">
					{
						new Promise((r) => {
							r('2');
						})
					}
				</Suspense>
			</div>,
			document.getElementById('target')
		);
		assert(document.getElementById('target').firstChild.textContent === '1');
		await sleep(0);
		assert(document.getElementById('target').firstChild.textContent === '2');
	});
});

function sleep(time): Promise<void> {
	return new Promise((r) => {
		setTimeout(r, time);
	});
}
