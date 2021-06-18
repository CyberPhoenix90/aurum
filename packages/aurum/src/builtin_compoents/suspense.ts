import { AurumComponentAPI, createLifeCycle, Renderable } from '../rendering/aurum_element';
import { DataSource } from '../stream/data_source';
export interface SuspenseProps {
	fallback?: Renderable;
}

export function Suspense(props: SuspenseProps, children: Renderable[], api: AurumComponentAPI) {
	const lc = createLifeCycle();

	api.onDetach(() => {
		lc.onDetach();
	});

	const rendered = api.prerender(children, lc);
	if (rendered.some((r) => r instanceof Promise)) {
		Promise.all(rendered).then(function result(res) {
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
	} else {
		api.synchronizeLifeCycle(lc);
		return rendered;
	}
	const data = new DataSource<Renderable | Renderable[]>(props?.fallback);

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
