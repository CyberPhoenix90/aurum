import { Renderable, AurumComponentAPI } from '../rendering/aurum_element';
import { DataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
export interface SuspenseProps {
	fallback?: Renderable[];
}

export function Suspense(props: SuspenseProps, children: Renderable[], api: AurumComponentAPI) {
	const data = new DataSource<Renderable>(props?.fallback);
	const cleanUp = new CancellationToken();
	api.onDetach(() => {
		cleanUp.cancel();
	});

	Promise.all(api.prerender(children, cleanUp)).then(
		(res) => {
			if (!cleanUp.isCanceled) {
				data.update(res);
			}
		},
		(e) => {
			cleanUp.cancel();
			return Promise.reject(e);
		}
	);

	return data;
}
