import { Renderable, AurumComponentAPI, aurumElementModelIdentitiy, AurumElementModel, DataSource, GenericDataSource, dsUnique, dsMap } from 'aurumjs';

export interface SceneRouterProps {
	sceneRoute: GenericDataSource<string>;
}

export function SceneRouter(props: SceneRouterProps, children: Renderable[], api: AurumComponentAPI) {
	children = [].concat.apply(
		[],
		children.filter((c) => !!c)
	);

	if (
		children.some(
			(c) =>
				!c[aurumElementModelIdentitiy] || !((c as AurumElementModel<any>).factory === Scene || (c as AurumElementModel<any>).factory === DefaultScene)
		)
	) {
		throw new Error('Scene router only accepts scene and default scene instances as children');
	}
	if (children.filter((c) => (c as AurumElementModel<any>).factory === DefaultScene).length > 1) {
		throw new Error('Too many default scenes only 0 or 1 allowed');
	}

	const routeDataSource = new DataSource<string>();

	const result = routeDataSource.transform(
		dsUnique(),
		dsMap((p) => selectRoute(p, children as any)),
		api.cancellationToken
	);

	props.sceneRoute.listenAndRepeat((route) => {
		routeDataSource.update(route);
	}, api.cancellationToken);

	return result;
}

function selectRoute(url: string, routes: AurumElementModel<SceneProps>[]): Renderable[] {
	if (url === undefined || url === null) {
		return routes.find((r) => r.factory === DefaultScene)?.children;
	} else {
		if (routes.find((r) => r.props?.path === url)) {
			return routes.find((r) => r.props?.path === url).children;
		} else {
			const segments = url.split('/');
			segments.pop();
			while (segments.length) {
				const path = segments.join('/');
				if (routes.find((r) => r.props?.path === path)) {
					return routes.find((r) => r.props?.path === path).children;
				}
				segments.pop();
			}
			return routes.find((r) => r.factory === DefaultScene)?.children;
		}
	}
}

export interface SceneProps {
	path: string;
}

export function Scene(props: SceneProps): undefined {
	return undefined;
}

export function DefaultScene(props: {}): undefined {
	return undefined;
}
