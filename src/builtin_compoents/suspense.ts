import { AurumComponentAPI, createLifeCycle, Renderable } from '../rendering/aurum_element';
import { DataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
export interface SuspenseProps {
	fallback?: Renderable;
}

export function Suspense(props: SuspenseProps, children: Renderable[], api: AurumComponentAPI) {
	const data = new DataSource<Renderable>(props?.fallback);
	const cleanUp = new CancellationToken();

	const lc = createLifeCycle();

	api.onDetach(() => {
		lc.onDetach();
	});

	Promise.all(api.prerender(children, lc)).then(
		(res) => {
			if (!cleanUp.isCanceled) {
				data.update(res);
				lc.onAttach();
			}
		},
		(e) => {
			lc.onDetach();
			return Promise.reject(e);
		}
	);

	return data;
}
