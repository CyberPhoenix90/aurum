import { AurumComponentAPI, createLifeCycle, Renderable } from '../rendering/aurum_element';
import { DataSource } from '../stream/data_source';
export interface SuspenseProps {
	fallback?: Renderable;
}

export function Suspense(props: SuspenseProps, children: Renderable[], api: AurumComponentAPI) {
	const data = new DataSource<Renderable>(props?.fallback);

	const lc = createLifeCycle();

	api.onDetach(() => {
		lc.onDetach();
	});

	Promise.all(api.prerender(children, lc)).then(function result(res) {
		if (res instanceof Promise) {
			res.then(result, onError);
		} else {
			const nestedRendered = api.prerender(res, lc);
			if (nestedRendered.some((s) => s instanceof Promise)) {
				Promise.all(nestedRendered).then(result, onError);
			} else {
				onDone(nestedRendered);
			}
		}
	}, onError);

	return data;

	function onDone(res: any[]) {
		if (!api.cancellationToken.isCanceled) {
			data.update(res);
			lc.onAttach();
		}
	}

	function onError(reason: any): Promise<never> {
		lc.onDetach();
		return Promise.reject(reason);
	}
}
