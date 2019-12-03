import { Switch } from './switch';
import { DataSource } from '../../stream/data_source';
import { AurumElementProps } from '../aurum_element';

export interface AurumRouterProps extends AurumElementProps {}

export class AurumRouter extends Switch<string> {
	constructor(props: AurumRouterProps) {
		const urlDataSource = new DataSource(location.hash.substring(1));
		super({
			...props,
			state: urlDataSource
		});

		window.addEventListener('hashchange', () => {
			urlDataSource.update(location.hash.substring(1));
		});
	}
}
