import { DataSource } from '../../stream/data_source';
import { ChildNode, buildRenderableFromModel } from './aurum_element';

const routeIdentity = Symbol('route');

export interface RouteInstance {
	[routeIdentity]: boolean;
	href: string;
	default: boolean;
	content: ChildNode[];
}

export function AurumRouter(props, children) {
	children = children.map(buildRenderableFromModel);
	if (children.some((c) => !c[routeIdentity])) {
		throw new Error('Aurum Router only accepts Route and DefaultRoute instances as children');
	}
	if (children.filter((c) => c.default).length > 1) {
		throw new Error('Too many default routes only 0 or 1 allowed');
	}

	const urlDataSource = new DataSource(location.hash.substring(1));

	window.addEventListener('hashchange', () => {
		const hash = location.hash.substring(1);
		if (hash.includes('?')) {
			urlDataSource.update(hash.substring(0, hash.indexOf('?')));
		} else {
			urlDataSource.update(hash);
		}
	});

	return urlDataSource.unique().map((p) => selectRoute(p, children));
}

function selectRoute(url: string, routes: RouteInstance[]): ChildNode[] {
	if (url === undefined || url === null) {
		return routes.find((r) => r.default)?.content;
	} else {
		if (routes.find((r) => r.href === url)) {
			return routes.find((r) => r.href === url).content;
		} else {
			const segments = url.split('/');
			segments.pop();
			while (segments.length) {
				const path = segments.join('/');
				if (routes.find((r) => r.href === path)) {
					return routes.find((r) => r.href === path).content;
				}
				segments.pop();
			}
			return routes.find((r) => r.default)?.content;
		}
	}
}

export interface RouteProps {
	href: string;
}

export function Route(props: RouteProps, children): RouteInstance {
	return {
		[routeIdentity]: true,
		content: children,
		default: false,
		href: props.href
	};
}

export function DefaultRoute(props: {}, children): RouteInstance {
	return {
		[routeIdentity]: true,
		content: children,
		default: true,
		href: undefined
	};
}
