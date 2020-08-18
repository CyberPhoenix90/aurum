import { DataSource } from '../stream/data_source';
import { Renderable, AurumComponentAPI, aurumElementModelIdentitiy, AurumElementModel } from '../rendering/aurum_element';
import { dsUnique } from '../stream/data_source_operators';

export function AurumRouter(props: {}, children: Renderable[], api: AurumComponentAPI) {
	children = [].concat.apply(
		[],
		children.filter((c) => !!c)
	);
	if (
		children.some(
			(c) =>
				!c[aurumElementModelIdentitiy] || !((c as AurumElementModel<any>).factory === Route || (c as AurumElementModel<any>).factory === DefaultRoute)
		)
	) {
		throw new Error('Aurum Router only accepts Route and DefaultRoute instances as children');
	}
	if (children.filter((c) => (c as AurumElementModel<any>).factory === DefaultRoute).length > 1) {
		throw new Error('Too many default routes only 0 or 1 allowed');
	}

	const urlDataSource = new DataSource(getUrlPath());

	api.cancellationToken.registerDomEvent(window, 'hashchange', () => {
		urlDataSource.update(getUrlPath());
	});

	return urlDataSource
		.transform(dsUnique(), api.cancellationToken)
		.withInitial(urlDataSource.value)
		.map((p) => selectRoute(p, children as any));
}

function getUrlPath(): string {
	const hash = location.hash.substring(1);
	if (hash.includes('?')) {
		return hash.substring(0, hash.indexOf('?'));
	} else if (hash.includes('#')) {
		return hash.substring(0, hash.indexOf('#'));
	} else {
		return hash;
	}
}

function selectRoute(url: string, routes: AurumElementModel<RouteProps>[]): Renderable[] {
	if (url === undefined || url === null) {
		return routes.find((r) => r.factory === DefaultRoute)?.children;
	} else {
		if (routes.find((r) => r.props?.href === url)) {
			return routes.find((r) => r.props?.href === url).children;
		} else {
			const segments = url.split('/');
			segments.pop();
			while (segments.length) {
				const path = segments.join('/');
				if (routes.find((r) => r.props?.href === path)) {
					return routes.find((r) => r.props?.href === path).children;
				}
				segments.pop();
			}
			return routes.find((r) => r.factory === DefaultRoute)?.children;
		}
	}
}

export interface RouteProps {
	href: string;
}

export function Route(props: RouteProps, children): undefined {
	return undefined;
}

export function DefaultRoute(props: {}, children): undefined {
	return undefined;
}
