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
			const hash = location.hash.substring(1);
			if (hash.includes('?')) {
				urlDataSource.update(hash.substring(0, hash.indexOf('?')));
			} else {
				urlDataSource.update(hash);
			}
		});
	}
}
