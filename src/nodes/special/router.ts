import { Switch } from './switch';
import { DataSource } from '../../stream/data_source';
import { AurumElementProps, Template, ChildNode } from './aurum_element';

export interface AurumRouterProps extends AurumElementProps {}

export class AurumRouter extends Switch<string> {
	constructor(props: AurumRouterProps, children: ChildNode[]) {
		const urlDataSource = new DataSource(location.hash.substring(1));
		super(
			{
				...props,
				state: urlDataSource
			},
			children
		);

		window.addEventListener('hashchange', () => {
			const hash = location.hash.substring(1);
			if (hash.includes('?')) {
				urlDataSource.update(hash.substring(0, hash.indexOf('?')));
			} else {
				urlDataSource.update(hash);
			}
		});
	}

	protected selectTemplate(ref: string): Template<void> {
		if (this.templateMap === undefined) {
			return this.template;
		}

		if (ref === undefined || ref === null) {
			return this.template;
		} else {
			if (this.templateMap[ref]) {
				return this.templateMap[ref];
			} else {
				const segments = ref.split('/');
				segments.pop();
				while (segments.length) {
					const path = segments.join('/');
					if (this.templateMap[path]) {
						return this.templateMap[path];
					}
					segments.pop();
				}
				return this.template;
			}
		}
	}
}
