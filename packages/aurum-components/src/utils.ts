import { CancellationToken, DataSource } from 'aurumjs';

export function aurumify<A>(
	dependencies: [DataSource<A>],
	style: (val1: A, lifecycleToken: CancellationToken) => string | DataSource<string>,
	token?: CancellationToken
): DataSource<string>;
export function aurumify<A, B>(
	dependencies: [DataSource<A>, DataSource<B>],
	style: (val1: A, val2: B, lifecycleToken: CancellationToken) => string | DataSource<string>,
	token?: CancellationToken
): DataSource<string>;
export function aurumify<A, B, C>(
	dependencies: [DataSource<A>, DataSource<B>, DataSource<C>],
	style: (val1: A, val2: B, val3: C, lifecycleToken: CancellationToken) => string | DataSource<string>,
	token?: CancellationToken
): DataSource<string>;
export function aurumify<A, B, C, D>(
	dependencies: [DataSource<A>, DataSource<B>, DataSource<C>, DataSource<D>],
	style: (val1: A, val2: B, val3: C, val4: D, lifecycleToken: CancellationToken) => string | DataSource<string>,
	token?: CancellationToken
): DataSource<string>;
export function aurumify<A, B, C, D, E>(
	dependencies: [DataSource<A>, DataSource<B>, DataSource<C>, DataSource<D>, DataSource<E>],
	style: (val1: A, val2: B, val3: C, val4: D, val5: E, lifecycleToken: CancellationToken) => string | DataSource<string>,
	token?: CancellationToken
): DataSource<string>;
export function aurumify<A, B, C, D, E, F>(
	dependencies: [DataSource<A>, DataSource<B>, DataSource<C>, DataSource<D>, DataSource<E>, DataSource<F>],
	style: (val1: A, val2: B, val3: C, val4: D, val5: E, val6: F, lifecycleToken: CancellationToken) => string | DataSource<string>,
	token?: CancellationToken
): DataSource<string>;
export function aurumify<A, B, C, D, E, F, G>(
	dependencies: [DataSource<A>, DataSource<B>, DataSource<C>, DataSource<D>, DataSource<E>, DataSource<F>, DataSource<G>],
	style: (val1: A, val2: B, val3: C, val4: D, val5: E, val6: F, val7: G, lifecycleToken: CancellationToken) => string | DataSource<string>,
	token?: CancellationToken
): DataSource<string>;
export function aurumify<A, B, C, D, E, F, G, H>(
	dependencies: [DataSource<A>, DataSource<B>, DataSource<C>, DataSource<D>, DataSource<E>, DataSource<F>, DataSource<G>, DataSource<H>],
	style: (val1: A, val2: B, val3: C, val4: D, val5: E, val6: F, val7: G, val8: H, lifecycleToken: CancellationToken) => string | DataSource<string>,
	token?: CancellationToken
): DataSource<string>;
export function aurumify<A, B, C, D, E, F, G, H, I>(
	dependencies: [DataSource<A>, DataSource<B>, DataSource<C>, DataSource<D>, DataSource<E>, DataSource<F>, DataSource<G>, DataSource<H>, DataSource<I>],
	style: (val1: A, val2: B, val3: C, val4: D, val5: E, val6: F, val7: G, val8: H, val9: I, lifecycleToken: CancellationToken) => string | DataSource<string>,
	token?: CancellationToken
): DataSource<string>;
export function aurumify(
	dependencies: DataSource<any>[],
	style: (...values: any[]) => string | DataSource<string>,
	token?: CancellationToken
): DataSource<string> {
	const result = new DataSource<string>();
	const s = DataSource.fromMultipleSources(dependencies);
	let lifecycleToken;
	s.listen(() => {
		if (lifecycleToken) {
			lifecycleToken.cancel();
		}
		lifecycleToken = new CancellationToken();
		const newStyle = style(...dependencies.map((s) => s.value), lifecycleToken);
		if (newStyle instanceof DataSource) {
			newStyle.listenAndRepeat((value) => {
				result.update(value);
			}, lifecycleToken);
		} else {
			result.update(newStyle);
		}
	}, token);
	s.update(undefined);

	return result;
}
