import { DataSource } from '../../stream/data_source';
import { ChildNode } from './aurum_element';

export interface SuspenseProps {
	fallback?: ChildNode;
}

export function Suspense(props: SuspenseProps, children: ChildNode[]) {
	const data = new DataSource<ChildNode>(props.fallback);
	Promise.all(children).then(() => {
		data.update(children);
	});

	return data;
}
