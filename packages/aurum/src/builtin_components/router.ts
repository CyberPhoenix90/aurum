import { AurumComponentAPI, AurumElementModel, Renderable } from '../rendering/aurum_element.js';
import { DataSource, ReadOnlyArrayDataSource } from '../stream/data_source.js';
import { dsDiff, dsFilter, dsMap, dsTap, dsUnique } from '../stream/data_source_operators.js';
import { urlHashEmitter, urlPathEmitter } from '../stream/emitters.js';
import { resolveChildren } from '../utilities/transclusion.js';

export function AurumRouter(
    props: {
        hashRouting?: boolean;
        urlPreprocessing?: (url: string) => string;
        validateNavigation?: (url: string, route: AurumElementModel<RouteProps>) => boolean;
        // For server side rendering or other cases where the url is not available from the browser. Can be useful for testing
        urlProvider?: DataSource<string>;
    },
    children: Renderable[],
    api: AurumComponentAPI
) {
    const resolvedChildren = resolveChildren<AurumElementModel<RouteProps>>(children, api.cancellationToken, (c) => {
        if ((c as AurumElementModel<any>).factory !== Route && (c as AurumElementModel<any>).factory !== DefaultRoute) {
            throw new Error('Aurum Router only accepts Route and DefaultRoute instances as children');
        }
    }).filter(Boolean);
    resolvedChildren
        .reduce(
            (acc, c) => {
                if ((c as AurumElementModel<any>).factory === DefaultRoute) {
                    return acc + 1;
                } else {
                    return acc;
                }
            },
            0,
            api.cancellationToken
        )
        .listenAndRepeat((count) => {
            if (count > 1) {
                throw new Error(`Too many default routes only 0 or 1 allowed. Found ${count}`);
            }
        });

    const urlDataSource = new DataSource<string>();

    if (props.urlProvider) {
        props.urlProvider.pipe(urlDataSource, api.cancellationToken);
    } else if (typeof window !== 'undefined') {
        if (props.hashRouting) {
            urlHashEmitter(urlDataSource, true, api.cancellationToken);
        } else {
            urlDataSource.update(window.location.pathname);
            urlPathEmitter(urlDataSource, api.cancellationToken);
        }
    }

    const activeRoute = new DataSource<AurumElementModel<RouteProps>>();

    activeRoute.transform(
        dsUnique(),
        dsDiff(),
        dsTap(({ newValue, oldValue }) => {
            if (oldValue) {
                oldValue.props?.onNavigateFrom?.();
            }
            if (newValue) {
                newValue.props?.onNavigateTo?.();
            }
        })
    );

    return urlDataSource
        .transform(dsUnique(), api.cancellationToken)
        .withInitial(urlDataSource.value)
        .transform(
            dsMap((url) => (props.urlPreprocessing ? props.urlPreprocessing(url) : url)),
            dsMap((path) => ({ path, route: selectRoute(path, resolvedChildren) })),
            dsFilter((r) => (props.validateNavigation ? props.validateNavigation(r.path, r.route) : true)),
            dsTap((r) => activeRoute.update(r.route)),
            dsMap((r) => r.route?.children)
        );
}

function selectRoute(url: string, routes: ReadOnlyArrayDataSource<AurumElementModel<RouteProps>>): AurumElementModel<RouteProps> {
    let selected: AurumElementModel<RouteProps>;
    if (url === undefined || url === null) {
        selected = routes.find((r) => r.factory === DefaultRoute);
    } else {
        if (routes.find((r) => r.props?.href === url)) {
            selected = routes.find((r) => r.props?.href === url);
        } else {
            const segments = url.split('/');
            segments.pop();
            while (segments.length) {
                const path = segments.join('/');
                if (routes.find((r) => r.props?.href === path)) {
                    selected = routes.find((r) => r.props?.href === path);
                    break;
                }
                segments.pop();
            }
            if (!selected) {
                selected = routes.find((r) => r.factory === DefaultRoute);
            }
        }
    }

    return selected;
}

export interface RouteProps {
    href: string;
    onNavigateTo?: () => void;
    onNavigateFrom?: () => void;
}

export function Route(props: RouteProps, children): undefined {
    return undefined;
}

export function DefaultRoute(props: Omit<RouteProps, 'href'>, children): undefined {
    return undefined;
}
