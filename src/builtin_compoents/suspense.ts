import { DataSource } from '../stream/data_source';
import { Renderable } from '../rendering/aurum_element';
import { render } from '../rendering/renderer';
export interface SuspenseProps {
	fallback?: Renderable[];
}

export function Suspense(props: SuspenseProps, children: Renderable[]) {
	const data = new DataSource<Renderable>(props?.fallback);
	Promise.all(render(children)).then((res) => {
		data.update(res);
	});

	return data;
}
